package com.example.bloodmanagement.dto;


public class RegisterRequest {

    private String name;
    private String email;
    private String password;

    // ✅ Eligibility questions (example)
    private boolean q1; // e.g. "Are you over 18 years old?"
    private boolean q2; // e.g. "Do you weigh more than 50kg?"
    private boolean q3; // e.g. "Have you slept well in the last 24 hours?"

    // Add more questions as needed

    public boolean isEligible() {
        // All questions must be "true" to be eligible
        return q1 && q2 && q3;
    }

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isQ1() { return q1; }
    public void setQ1(boolean q1) { this.q1 = q1; }

    public boolean isQ2() { return q2; }
    public void setQ2(boolean q2) { this.q2 = q2; }

    public boolean isQ3() { return q3; }
    public void setQ3(boolean q3) { this.q3 = q3; }
}
