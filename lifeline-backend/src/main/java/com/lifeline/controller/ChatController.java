package com.lifeline.controller;

import com.lifeline.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private static final int MAX_REQUESTS_PER_MINUTE = 20;
    private static final long WINDOW_MILLIS = 60_000L;

    private final ChatService chatService;
    private final Map<String, RequestWindow> rateLimitMap = new ConcurrentHashMap<>();

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    public static class ChatRequest {
        private String message;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class ChatResponse {
        private String reply;
        private double confidence;
        private boolean lowConfidence;
        private java.util.List<String> suggestedQuestions;

        public ChatResponse(String reply, double confidence, boolean lowConfidence, java.util.List<String> suggestedQuestions) {
            this.reply = reply;
            this.confidence = confidence;
            this.lowConfidence = lowConfidence;
            this.suggestedQuestions = suggestedQuestions;
        }

        public String getReply() {
            return reply;
        }

        public double getConfidence() {
            return confidence;
        }

        public boolean isLowConfidence() {
            return lowConfidence;
        }

        public java.util.List<String> getSuggestedQuestions() {
            return suggestedQuestions;
        }
    }

    private static class RequestWindow {
        long windowStart;
        int count;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatRequest request, HttpServletRequest servletRequest) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body("Message cannot be empty.");
        }

        String clientKey = resolveClientKey(servletRequest);
        if (isRateLimited(clientKey)) {
            logger.warn("Rate limit exceeded for client {}", clientKey);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Too many requests to chat. Please wait a moment and try again.");
        }

        String rawMessage = request.getMessage().trim();
        if (rawMessage.length() > 500) {
            rawMessage = rawMessage.substring(0, 500);
        }

        logger.info("Chat request from {} at {}: {}", clientKey, Instant.now(), rawMessage);

        ChatService.ChatAnswer answer = chatService.findBestAnswer(rawMessage);

        String safeReply = sanitizePlainText(answer.getAnswer());

        ChatResponse response = new ChatResponse(
                safeReply,
                answer.getConfidence(),
                answer.isLowConfidence(),
                answer.getSuggestedQuestions()
        );

        logger.info("Chat response to {} (confidence={}): {}", clientKey, answer.getConfidence(), truncateForLog(safeReply));

        return ResponseEntity.ok(response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        if (ip == null || ip.isBlank()) {
            ip = "unknown";
        }
        return ip;
    }

    private boolean isRateLimited(String clientKey) {
        long now = System.currentTimeMillis();
        RequestWindow window = rateLimitMap.computeIfAbsent(clientKey, k -> {
            RequestWindow w = new RequestWindow();
            w.windowStart = now;
            w.count = 0;
            return w;
        });

        synchronized (window) {
            if (now - window.windowStart > WINDOW_MILLIS) {
                window.windowStart = now;
                window.count = 0;
            }
            window.count++;
            return window.count > MAX_REQUESTS_PER_MINUTE;
        }
    }

    private String sanitizePlainText(String input) {
        if (input == null) {
            return "";
        }
        return input.replaceAll("[\\p{Cntrl}&&[^\n\t\r]]", "").trim();
    }

    private String truncateForLog(String text) {
        if (text == null) {
            return "";
        }
        if (text.length() <= 120) {
            return text;
        }
        return text.substring(0, 117) + "...";
    }
}

