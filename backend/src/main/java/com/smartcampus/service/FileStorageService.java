package com.smartcampus.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String storeFile(MultipartFile file);

    Resource loadFile(String filePath);

    void deleteFile(String filePath);

    boolean isValidImageType(String contentType);
}
