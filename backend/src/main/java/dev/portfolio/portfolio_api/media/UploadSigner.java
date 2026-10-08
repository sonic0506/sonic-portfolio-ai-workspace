package dev.portfolio.portfolio_api.media;

import java.time.Duration;
import java.util.Map;

/** Signs a one-off S3 PUT. The real one is {@link S3UploadSigner}; tests swap in a fake. */
public interface UploadSigner {

    /** Headers the browser must send unchanged (Content-Type); the size is fixed in the signature too. */
    record SignedUpload(String url, Map<String, String> headers) {
    }

    boolean enabled();

    SignedUpload presignPut(String key, String contentType, long sizeBytes, Duration ttl);
}
