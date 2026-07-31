package com.dishaspora.auth.repository;

import com.dishaspora.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    /** Revoke every active token for a user (logout-all / password change / delete). */
    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.userId = :userId and r.revoked = false")
    void revokeAllForUser(Long userId);

    /** Housekeeping: drop expired/revoked rows. */
    @Modifying
    @Query("delete from RefreshToken r where r.expiresAt < :cutoff or r.revoked = true")
    void deleteExpiredAndRevoked(Instant cutoff);
}
