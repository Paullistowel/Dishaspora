package com.dishaspora.auth.repository;

import com.dishaspora.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByVerificationToken(String verificationToken);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findByEmailChangeToken(String emailChangeToken);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name, String email);

    long countByPremiumTrue();

    long countByCountry(String country);
}
