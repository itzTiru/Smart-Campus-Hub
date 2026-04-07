package com.smartcampus.repository;

import com.smartcampus.entity.Resource;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);

    Page<Resource> findByType(ResourceType type, Pageable pageable);

    Page<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status, Pageable pageable);

    @Query("{'status': 'ACTIVE', '_id': {$nin: ?0}}")
    List<Resource> findAvailableExcluding(List<String> excludedIds);
}
