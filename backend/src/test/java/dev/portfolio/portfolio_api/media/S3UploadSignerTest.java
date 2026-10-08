package dev.portfolio.portfolio_api.media;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.junit.jupiter.api.Test;

/** Presigning is local (no network). The size limit only holds if Content-Length is in the signature. */
class S3UploadSignerTest {

    @Test
    void signsContentTypeAndLengthIntoThePutUrl() {
        var signer = new S3UploadSigner("test-bucket", "ap-northeast-2", "AKIATESTKEY", "test-secret");
        var signed = signer.presignPut("images/2026/10/a.png", "image/png", 1234, Duration.ofMinutes(10));

        URI url = URI.create(signed.url());
        assertThat(url.getHost()).startsWith("test-bucket.s3.");
        assertThat(url.getPath()).isEqualTo("/images/2026/10/a.png");
        String query = URLDecoder.decode(url.getRawQuery(), StandardCharsets.UTF_8);
        assertThat(query).contains("X-Amz-SignedHeaders=content-length;content-type;host");
        assertThat(query).contains("X-Amz-Expires=600");
        assertThat(signed.headers()).containsEntry("Content-Type", "image/png");
    }

    @Test
    void staysOffWithoutKeys() {
        assertThat(new S3UploadSigner("test-bucket", "ap-northeast-2", "", "").enabled()).isFalse();
        assertThat(new S3UploadSigner("", "ap-northeast-2", "AKIATESTKEY", "test-secret").enabled()).isFalse();
    }
}
