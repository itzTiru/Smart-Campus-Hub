package com.smartcampus.repository;

import com.smartcampus.entity.Technician;
import com.smartcampus.entity.enums.TicketCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends MongoRepository<Technician, String> {

    Optional<Technician> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<Technician> findByEmail(String email);

    List<Technician> findBySpecialtyCategoryAndAvailableTrueAndIsActiveTrue(TicketCategory specialtyCategory);
}
