package com.smartcampus.service;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ResourceService {

    ResourceResponse createResource(ResourceRequest request);

    PagedResponse<ResourceResponse> getAllResources(ResourceType type, ResourceStatus status,
                                                    Integer minCapacity, String location,
                                                    int page, int size);

    ResourceResponse getResourceById(String id);

    ResourceResponse updateResource(String id, ResourceRequest request);

    void deleteResource(String id);

    ResourceResponse toggleResourceStatus(String id);

    PagedResponse<ResourceResponse> searchResources(String keyword, int page, int size);

    List<ResourceResponse> getAvailableResources(LocalDateTime startTime, LocalDateTime endTime);

    List<BookingResponse> getResourceSchedule(String resourceId, LocalDate date);
}
