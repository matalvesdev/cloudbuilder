package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.UserMfa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMfaRepository extends JpaRepository<UserMfa, String> {
    Optional<UserMfa> findByUserId(String userId);
}
