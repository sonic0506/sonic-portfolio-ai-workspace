package dev.portfolio.portfolio_api.media;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MediaAdminService {

    public record UploadRequest(
            @NotBlank @Size(max = 255) String fileName,
            @NotBlank @Size(max = 100) String contentType,
            @NotNull @Positive Long sizeBytes,
            @NotNull MediaPurpose purpose) {
    }

    /** uploadUrl is a presigned PUT: send the file with exactly these headers, then use publicUrl. */
    public record UploadTicket(long id, String uploadUrl, Map<String, String> headers, String publicUrl) {
    }

    public record MediaItem(long id, String url, String originalName, String contentType, long sizeBytes,
                            MediaPurpose purpose, Instant createdAt) {
    }

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif", "image/svg+xml", "svg");
    private static final Duration TICKET_TTL = Duration.ofMinutes(10);

    private final UploadSigner signer;
    private final JdbcTemplate jdbc;
    private final String publicBaseUrl;
    private final String keyPrefix;
    private final long maxBytes;

    public MediaAdminService(UploadSigner signer, JdbcTemplate jdbc,
                             @Value("${app.media.public-base-url:}") String publicBaseUrl,
                             @Value("${app.media.key-prefix:dev/images}") String keyPrefix,
                             @Value("${app.media.max-bytes:10485760}") long maxBytes) {
        this.signer = signer;
        this.jdbc = jdbc;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
        this.keyPrefix = keyPrefix.replaceAll("^/+|/+$", "");
        this.maxBytes = maxBytes;
    }

    public UploadTicket createUpload(UploadRequest r) {
        if (!signer.enabled() || publicBaseUrl.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "image upload is not configured");
        }
        String contentType = r.contentType().trim().toLowerCase();
        if (!r.purpose().allows(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    contentType + " is not allowed for " + r.purpose());
        }
        if (r.sizeBytes() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is larger than " + maxBytes + " bytes");
        }
        YearMonth month = YearMonth.now(ZoneOffset.UTC);
        String key = "%s/%d/%02d/%s.%s".formatted(keyPrefix, month.getYear(), month.getMonthValue(),
                UUID.randomUUID(), EXTENSIONS.get(contentType));
        UploadSigner.SignedUpload signed = signer.presignPut(key, contentType, r.sizeBytes(), TICKET_TTL);
        String publicUrl = publicBaseUrl + "/" + key;
        // Recorded when the ticket is issued; an upload that never happens shows as a broken image in the list.
        Long id = jdbc.queryForObject("""
                insert into media (object_key, url, original_name, content_type, size_bytes, purpose)
                values (?, ?, ?, ?, ?, ?) returning id""", Long.class,
                key, publicUrl, r.fileName().trim(), contentType, r.sizeBytes(), r.purpose().name());
        return new UploadTicket(id, signed.url(), signed.headers(), publicUrl);
    }

    public List<MediaItem> list(MediaPurpose purpose) {
        return jdbc.query("""
                        select id, url, original_name, content_type, size_bytes, purpose, created_at from media
                        where cast(? as text) is null or purpose = ? order by id desc limit 200""",
                (rs, n) -> new MediaItem(rs.getLong("id"), rs.getString("url"), rs.getString("original_name"),
                        rs.getString("content_type"), rs.getLong("size_bytes"),
                        MediaPurpose.valueOf(rs.getString("purpose")), rs.getTimestamp("created_at").toInstant()),
                purpose == null ? null : purpose.name(), purpose == null ? null : purpose.name());
    }
}
