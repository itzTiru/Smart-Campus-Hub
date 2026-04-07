package com.smartcampus.service;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.service.impl.ResourceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock private ResourceRepository resourceRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private MongoTemplate mongoTemplate;

    @InjectMocks
    private ResourceServiceImpl resourceService;

    private Resource sampleResource;
    private ResourceRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleResource = Resource.builder()
                .id("res1")
                .name("Main Lecture Hall")
                .type(ResourceType.LECTURE_HALL)
                .capacity(200)
                .location("Block A, Floor 2")
                .building("Block A")
                .floor("2")
                .description("Large lecture hall")
                .availabilityStart(LocalTime.of(8, 0))
                .availabilityEnd(LocalTime.of(18, 0))
                .status(ResourceStatus.ACTIVE)
                .build();

        sampleRequest = ResourceRequest.builder()
                .name("Main Lecture Hall")
                .type(ResourceType.LECTURE_HALL)
                .capacity(200)
                .location("Block A, Floor 2")
                .building("Block A")
                .floor("2")
                .description("Large lecture hall")
                .availabilityStart(LocalTime.of(8, 0))
                .availabilityEnd(LocalTime.of(18, 0))
                .build();
    }

    @Test
    @DisplayName("Should create a resource successfully")
    void createResource_Success() {
        when(resourceRepository.save(any(Resource.class))).thenReturn(sampleResource);

        ResourceResponse response = resourceService.createResource(sampleRequest);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Main Lecture Hall");
        assertThat(response.getType()).isEqualTo(ResourceType.LECTURE_HALL);
        assertThat(response.getStatus()).isEqualTo(ResourceStatus.ACTIVE);
        verify(resourceRepository).save(any(Resource.class));
    }

    @Test
    @DisplayName("Should get resource by ID")
    void getResourceById_Success() {
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(sampleResource));

        ResourceResponse response = resourceService.getResourceById("res1");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("res1");
        assertThat(response.getName()).isEqualTo("Main Lecture Hall");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for invalid ID")
    void getResourceById_NotFound() {
        when(resourceRepository.findById("res99")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resourceService.getResourceById("res99"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should update a resource")
    void updateResource_Success() {
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any(Resource.class))).thenReturn(sampleResource);

        sampleRequest.setName("Updated Hall");
        ResourceResponse response = resourceService.updateResource("res1", sampleRequest);

        assertThat(response).isNotNull();
        verify(resourceRepository).save(any(Resource.class));
    }

    @Test
    @DisplayName("Should delete a resource")
    void deleteResource_Success() {
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(sampleResource));

        resourceService.deleteResource("res1");

        verify(resourceRepository).delete(sampleResource);
    }

    @Test
    @DisplayName("Should throw when deleting non-existent resource")
    void deleteResource_NotFound() {
        when(resourceRepository.findById("res99")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resourceService.deleteResource("res99"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should toggle resource status from ACTIVE to OUT_OF_SERVICE")
    void toggleStatus_ActiveToOutOfService() {
        sampleResource.setStatus(ResourceStatus.ACTIVE);
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

        ResourceResponse response = resourceService.toggleResourceStatus("res1");

        assertThat(response.getStatus()).isEqualTo(ResourceStatus.OUT_OF_SERVICE);
    }

    @Test
    @DisplayName("Should toggle resource status from OUT_OF_SERVICE to ACTIVE")
    void toggleStatus_OutOfServiceToActive() {
        sampleResource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

        ResourceResponse response = resourceService.toggleResourceStatus("res1");

        assertThat(response.getStatus()).isEqualTo(ResourceStatus.ACTIVE);
    }
}
