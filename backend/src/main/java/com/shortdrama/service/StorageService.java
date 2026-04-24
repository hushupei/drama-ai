package com.shortdrama.service;

import java.io.InputStream;

public interface StorageService {
    String uploadFile(String bucketName, String objectName, InputStream stream, long size, String contentType);
    InputStream downloadFile(String bucketName, String objectName);
    void deleteFile(String bucketName, String objectName);
    String getFileUrl(String bucketName, String objectName, int expirySeconds);
    boolean bucketExists(String bucketName);
    void createBucket(String bucketName);
}
