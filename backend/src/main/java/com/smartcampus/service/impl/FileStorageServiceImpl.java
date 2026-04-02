package com.smartcampus.service.impl;

import com.smartcampus.exception.FileStorageException;
import com.smartcampus.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path uploadPath;
    private final List<String> allowedTypes;

    public FileStorageServiceImpl(
            @Value("${app.file.upload-dir:uploads}") String uploadDir,
            @Value("${app.file.allowed-types:image/jpeg,image/png,image/gif,image/webp}") String allowedTypes) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.allowedTypes = Arrays.asList(allowedTypes.split(","));
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + uploadPath, e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new FileStorageException("File name is invalid");
        }

        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
        }

        String uniqueFileName = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = uploadPath.resolve(uniqueFileName).normalize();

            if (!targetLocation.getParent().equals(uploadPath)) {
                throw new FileStorageException("Cannot store file outside the upload directory");
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return uniqueFileName;
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalFileName, e);
        }
    }

    @Override
    public Resource loadFile(String filePath) {
        try {
            Path file = uploadPath.resolve(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new FileStorageException("File not found or not readable: " + filePath);
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new FileStorageException("File not found: " + filePath, e);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path file = uploadPath.resolve(filePath).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + filePath, e);
        }
    }

    @Override
    public boolean isValidImageType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return allowedTypes.contains(contentType.toLowerCase());
    }
}
