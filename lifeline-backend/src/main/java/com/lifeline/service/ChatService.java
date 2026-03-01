package com.lifeline.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeline.model.Inventory;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    private static final double CONFIDENCE_THRESHOLD = 0.22;

    private static class FaqItem {
        public String id;
        public String question;
        public String answer;
        public List<String> tags;
    }

    public static class ChatAnswer {
        private final String answer;
        private final double confidence;
        private final String sourceId;
        private final List<String> suggestedQuestions;

        public ChatAnswer(String answer, double confidence, String sourceId, List<String> suggestedQuestions) {
            this.answer = answer;
            this.confidence = confidence;
            this.sourceId = sourceId;
            this.suggestedQuestions = suggestedQuestions != null ? suggestedQuestions : List.of();
        }

        public String getAnswer() {
            return answer;
        }

        public double getConfidence() {
            return confidence;
        }

        public String getSourceId() {
            return sourceId;
        }

        public List<String> getSuggestedQuestions() {
            return suggestedQuestions;
        }

        public boolean isLowConfidence() {
            return confidence < CONFIDENCE_THRESHOLD;
        }
    }

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<FaqItem> faqItems = new ArrayList<>();
    private final List<FaqItem> defaultFaqItems = new ArrayList<>();

    // Term -> IDF score
    private final Map<String, Double> idfMap = new HashMap<>();
    // FAQ index -> term -> tf-idf weight
    private final List<Map<String, Double>> faqVectors = new ArrayList<>();

    private final InventoryService inventoryService;

    public ChatService(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostConstruct
    public void init() {
        loadFaqData();
        buildTfIdfVectors();
    }

    private void loadFaqData() {
        try {
            ClassPathResource resource = new ClassPathResource("data/faq.json");
            try (InputStream is = resource.getInputStream()) {
                String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                List<FaqItem> loaded = objectMapper.readValue(json, new TypeReference<List<FaqItem>>() {});
                faqItems.clear();
                faqItems.addAll(loaded);
                defaultFaqItems.clear();
                for (FaqItem item : faqItems) {
                    if (item.tags != null && item.tags.contains("default")) {
                        defaultFaqItems.add(item);
                    }
                }
                logger.info("Loaded {} FAQ items for chatbot ({} marked as default).", faqItems.size(), defaultFaqItems.size());
            }
        } catch (IOException e) {
            logger.error("Failed to load FAQ data for chatbot", e);
        }
    }

    private void buildTfIdfVectors() {
        idfMap.clear();
        faqVectors.clear();

        if (faqItems.isEmpty()) {
            return;
        }

        List<List<String>> documents = faqItems.stream()
                .map(faq -> tokenize(faq.question + " " + safeJoinTags(faq.tags)))
                .toList();

        Map<String, Integer> df = new HashMap<>();
        for (List<String> docTokens : documents) {
            Set<String> uniqueTerms = new HashSet<>(docTokens);
            for (String term : uniqueTerms) {
                df.put(term, df.getOrDefault(term, 0) + 1);
            }
        }

        int docCount = documents.size();
        for (Map.Entry<String, Integer> entry : df.entrySet()) {
            String term = entry.getKey();
            int count = entry.getValue();
            double idf = Math.log((double) docCount / (1 + count));
            idfMap.put(term, idf);
        }

        for (List<String> tokens : documents) {
            Map<String, Double> tf = new HashMap<>();
            for (String token : tokens) {
                tf.put(token, tf.getOrDefault(token, 0.0) + 1.0);
            }
            int size = tokens.size();
            Map<String, Double> vector = new HashMap<>();
            for (Map.Entry<String, Double> entry : tf.entrySet()) {
                String term = entry.getKey();
                double termFreq = entry.getValue() / size;
                double idf = idfMap.getOrDefault(term, 0.0);
                vector.put(term, termFreq * idf);
            }
            faqVectors.add(vector);
        }
        logger.info("Built TF-IDF vectors for {} FAQ items.", faqVectors.size());
    }

    private String safeJoinTags(List<String> tags) {
        if (tags == null) {
            return "";
        }
        return String.join(" ", tags);
    }

    private List<String> tokenize(String text) {
        if (text == null) {
            return Collections.emptyList();
        }
        String normalized = text.toLowerCase(Locale.ENGLISH);
        String[] rawTokens = normalized.split("[^a-z0-9+]+");
        List<String> tokens = new ArrayList<>();
        Set<String> stopWords = getStopWords();
        for (String token : rawTokens) {
            if (token.isBlank()) {
                continue;
            }
            if (stopWords.contains(token)) {
                continue;
            }
            tokens.add(token);
        }
        return tokens;
    }

    private Set<String> getStopWords() {
        return new HashSet<>(Arrays.asList(
                "the", "and", "or", "a", "an", "to", "of", "in", "on",
                "for", "is", "are", "can", "i", "me", "my", "you",
                "how", "what", "when", "where", "who", "which", "do",
                "donate", "donation", "blood"
        ));
    }

    public ChatAnswer findBestAnswer(String message) {
        if (message == null || message.isBlank() || faqItems.isEmpty()) {
            return new ChatAnswer(getFallbackMessage(), 0.0, null, getTopDefaultQuestions(3));
        }

        String trimmed = message.trim();
        logger.info("Chat query received: {}", trimmed);

        // Exact match for one of the predefined default questions (chips)
        FaqItem defaultMatch = findDefaultByQuestion(trimmed);
        if (defaultMatch != null) {
            return new ChatAnswer(defaultMatch.answer, 1.0, defaultMatch.id, getTopDefaultQuestions(3));
        }

        // High-level, non-personalized inventory lookup using live database data.
        // This only returns aggregated stock by blood type and never exposes donor data.
        if (isInventoryAvailabilityQuery(trimmed)) {
            return buildInventoryAnswer();
        }

        List<String> queryTokens = tokenize(trimmed);
        if (queryTokens.isEmpty()) {
            return new ChatAnswer(getFallbackMessage(), 0.0, null, getTopDefaultQuestions(3));
        }

        Map<String, Double> tf = new HashMap<>();
        for (String token : queryTokens) {
            tf.put(token, tf.getOrDefault(token, 0.0) + 1.0);
        }
        int size = queryTokens.size();
        Map<String, Double> queryVector = new HashMap<>();
        for (Map.Entry<String, Double> entry : tf.entrySet()) {
            String term = entry.getKey();
            double termFreq = entry.getValue() / size;
            double idf = idfMap.getOrDefault(term, 0.0);
            queryVector.put(term, termFreq * idf);
        }

        double bestScore = -1.0;
        int bestIndex = -1;
        double[] scores = new double[faqVectors.size()];
        for (int i = 0; i < faqVectors.size(); i++) {
            double score = cosineSimilarity(queryVector, faqVectors.get(i));
            scores[i] = score;
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }

        if (bestIndex < 0 || bestIndex >= faqItems.size()) {
            return new ChatAnswer(getFallbackMessage(), 0.0, null, getTopDefaultQuestions(3));
        }

        FaqItem bestFaq = faqItems.get(bestIndex);
        double confidence = Math.max(bestScore, 0.0);

        logger.info("Best FAQ match: id={}, confidence={}", bestFaq.id, confidence);

        List<String> suggested = buildSuggestedQuestions(scores, 3);

        if (confidence < CONFIDENCE_THRESHOLD) {
            String polite = getFallbackMessage();
            return new ChatAnswer(polite, confidence, bestFaq.id, suggested);
        }

        return new ChatAnswer(bestFaq.answer, confidence, bestFaq.id, suggested);
    }

    private double cosineSimilarity(Map<String, Double> v1, Map<String, Double> v2) {
        if (v1.isEmpty() || v2.isEmpty()) {
            return 0.0;
        }

        Set<String> allKeys = new HashSet<>();
        allKeys.addAll(v1.keySet());
        allKeys.addAll(v2.keySet());

        double dot = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (String key : allKeys) {
            double a = v1.getOrDefault(key, 0.0);
            double b = v2.getOrDefault(key, 0.0);
            dot += a * b;
            norm1 += a * a;
            norm2 += b * b;
        }

        if (norm1 == 0.0 || norm2 == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    private String getFallbackMessage() {
        return "I\u2019m not sure about that one \u2014 try one of these suggested questions above, or contact your site administrator or blood bank for more details.";
    }

    private boolean isInventoryAvailabilityQuery(String message) {
        String m = message.toLowerCase(Locale.ENGLISH);
        if (m.contains("blood availability") || m.contains("availability of blood")) {
            return true;
        }
        if (m.contains("blood stock") || m.contains("stock of blood")) {
            return true;
        }
        if (m.contains("available units") && m.contains("blood")) {
            return true;
        }
        if (m.contains("check blood") && (m.contains("availability") || m.contains("stock"))) {
            return true;
        }
        return false;
    }

    private ChatAnswer buildInventoryAnswer() {
        try {
            List<Inventory> all = inventoryService.getAllStock();
            if (all == null || all.isEmpty()) {
                String msg = "I could not find any blood stock records in the system right now.\n" +
                        "Please check the Inventory module on the dashboard or contact an administrator.";
                return new ChatAnswer(msg, 0.4, "inventory_empty", getTopDefaultQuestions(3));
            }

            Map<String, Integer> byType = new TreeMap<>();
            for (Inventory item : all) {
                if (item == null) {
                    continue;
                }
                String status = item.getStatus() != null ? item.getStatus().toUpperCase(Locale.ENGLISH) : "";
                String safety = item.getSafetyFlag() != null ? item.getSafetyFlag().toUpperCase(Locale.ENGLISH) : "";
                if (!status.contains("AVAILABLE") || safety.contains("BIO")) {
                    continue;
                }
                String type = item.getBloodType() != null ? item.getBloodType().toUpperCase(Locale.ENGLISH) : "UNKNOWN";
                int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                if (qty <= 0) {
                    continue;
                }
                byType.put(type, byType.getOrDefault(type, 0) + qty);
            }

            if (byType.isEmpty()) {
                String msg = "There is currently no SAFE blood marked as AVAILABLE in the inventory.\n" +
                        "Please check the Inventory module or contact the blood bank for the latest details.";
                return new ChatAnswer(msg, 0.45, "inventory_none_available", getTopDefaultQuestions(3));
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Here is a summary of current SAFE blood stock marked as AVAILABLE in the system:\n");
            for (Map.Entry<String, Integer> entry : byType.entrySet()) {
                sb.append("• ").append(entry.getKey()).append(": ")
                        .append(entry.getValue()).append(" unit");
                if (entry.getValue() != 1) {
                    sb.append("s");
                }
                sb.append("\n");
            }
            sb.append("\nFor more detailed information, please open the Inventory module on the dashboard or speak with the blood bank staff.");

            return new ChatAnswer(sb.toString().trim(), 0.75, "inventory_summary", getTopDefaultQuestions(3));
        } catch (Exception e) {
            logger.error("Failed to build inventory-based chat answer", e);
            String msg = "I tried to check the current blood stock, but something went wrong.\n" +
                    "Please open the Inventory module on the dashboard or contact an administrator for accurate availability.";
            return new ChatAnswer(msg, 0.3, "inventory_error", getTopDefaultQuestions(3));
        }
    }

    private FaqItem findDefaultByQuestion(String message) {
        String normalized = normalizeQuestion(message);
        for (FaqItem item : defaultFaqItems) {
            if (normalizeQuestion(item.question).equals(normalized)) {
                return item;
            }
        }
        return null;
    }

    private String normalizeQuestion(String q) {
        if (q == null) {
            return "";
        }
        return q.trim().toLowerCase(Locale.ENGLISH);
    }

    private List<String> getTopDefaultQuestions(int limit) {
        List<String> result = new ArrayList<>();
        for (FaqItem item : defaultFaqItems) {
            if (result.size() >= limit) {
                break;
            }
            if (item.question != null) {
                result.add(item.question);
            }
        }
        return result;
    }

    private List<String> buildSuggestedQuestions(double[] scores, int limit) {
        if (scores == null || scores.length == 0 || faqItems.isEmpty()) {
            return getTopDefaultQuestions(limit);
        }
        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i < scores.length; i++) {
            indices.add(i);
        }
        indices.sort((i1, i2) -> Double.compare(scores[i2], scores[i1]));

        List<String> suggestions = new ArrayList<>();
        for (int idx : indices) {
            if (idx < 0 || idx >= faqItems.size()) {
                continue;
            }
            FaqItem item = faqItems.get(idx);
            if (item.question == null) {
                continue;
            }
            String q = item.question;
            if (!suggestions.contains(q)) {
                suggestions.add(q);
            }
            if (suggestions.size() >= limit) {
                break;
            }
        }

        if (suggestions.isEmpty()) {
            return getTopDefaultQuestions(limit);
        }
        return suggestions;
    }

    public List<String> getFaqQuestions() {
        return faqItems.stream()
                .map(f -> f.question)
                .collect(Collectors.toList());
    }
}

