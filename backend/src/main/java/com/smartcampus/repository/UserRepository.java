package com.smartcampus.repository;

import com.smartcampus.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByOauthProviderId(String oauthProviderId);

    boolean existsByEmail(String email);
}
