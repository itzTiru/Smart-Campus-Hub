package com.smartcampus.service;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.TicketRepository;
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
    @Mock private TicketRepository ticketRepository;
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
        when(resourceRepository.findById("507f1f77bcf86cd799439011")).thenReturn(Optional.of(sampleResource));
        when(bookingRepository.countByResourceId(any())).thenReturn(0L);
        when(ticketRepository.countByResourceId(any())).thenReturn(0L);

        resourceService.deleteResource("507f1f77bcf86cd799439011");

        verify(resourceRepository).delete(sampleResource);
    }

    @Test
    @DisplayName("Should block delete when resource has related bookings")
    void deleteResource_WithBookings_ShouldThrowBadRequest() {
        when(resourceRepository.findById("507f1f77bcf86cd799439011")).thenReturn(Optional.of(sampleResource));
        when(bookingRepository.countByResourceId(any())).thenReturn(2L);
        when(ticketRepository.countByResourceId(any())).thenReturn(0L);

        assertThatThrownBy(() -> resourceService.deleteResource("507f1f77bcf86cd799439011"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot delete resource because it is referenced");

        verify(resourceRepository, never()).delete(any(Resource.class));
    }

    @Test
    @DisplayName("Should block delete when resource has related tickets")
    void deleteResource_WithTickets_ShouldThrowBadRequest() {
        when(resourceRepository.findById("507f1f77bcf86cd799439011")).thenReturn(Optional.of(sampleResource));
        when(bookingRepository.countByResourceId(any())).thenReturn(0L);
        when(ticketRepository.countByResourceId(any())).thenReturn(3L);

        assertThatThrownBy(() -> resourceService.deleteResource("507f1f77bcf86cd799439011"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot delete resource because it is referenced");

        verify(resourceRepository, never()).delete(any(Resource.class));
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
