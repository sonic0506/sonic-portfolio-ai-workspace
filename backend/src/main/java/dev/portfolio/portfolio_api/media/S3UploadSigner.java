package dev.portfolio.portfolio_api.media;

import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

/**
 * Presigned PUT with Content-Type and Content-Length in the signature, so S3 rejects any other type or size.
 * Lightsail cannot carry an IAM role, so it uses the upload-only IAM user's key (deploy/S3_SETUP.md).
 */
@Component
public class S3UploadSigner implements UploadSigner {

    private final String bucket;
    private final S3Presigner presigner; // null until bucket and keys are configured

    public S3UploadSigner(@Value("${app.media.bucket:}") String bucket,
                          @Value("${app.media.region:ap-northeast-2}") String region,
                          @Value("${app.media.access-key-id:}") String accessKeyId,
                          @Value("${app.media.secret-access-key:}") String secretAccessKey) {
        this.bucket = bucket;
        this.presigner = bucket.isBlank() || accessKeyId.isBlank() || secretAccessKey.isBlank() ? null
                : S3Presigner.builder()
                        .region(Region.of(region))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                        .build();
    }

    @Override
    public boolean enabled() {
        return presigner != null;
    }

    @Override
    public SignedUpload presignPut(String key, String contentType, long sizeBytes, Duration ttl) {
        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(bucket).key(key).contentType(contentType).contentLength(sizeBytes).build();
        PresignedPutObjectRequest signed = presigner.presignPutObject(r -> r.signatureDuration(ttl).putObjectRequest(put));
        return new SignedUpload(signed.url().toString(), Map.of("Content-Type", contentType));
    }
}
