package com.example.bloodmanagement.service;




import com.example.bloodmanagement.entity.UserEntity;
import com.example.bloodmanagement.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository repo;


    public CustomUserDetailsService(UserRepository repo) {
        this.repo = repo;


    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = repo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new CustomUserDetails(user);
    }

}