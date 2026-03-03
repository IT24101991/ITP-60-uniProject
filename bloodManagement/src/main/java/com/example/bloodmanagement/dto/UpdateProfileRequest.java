package com.example.bloodmanagement.dto;


public class UpdateProfileRequest {
    private String name;
    private String email;    // optional; allow changing email
    private String password; // optional; null/blank = keep old password

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
