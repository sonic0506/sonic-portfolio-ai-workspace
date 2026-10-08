# 이미지 저장소(S3 + CloudFront) 설정 — 사용자 콘솔 작업

이미지 업로드 기능(ADR-0020 예정)을 위해 AWS 콘솔에서 직접 하는 작업이다. 순서대로 진행하고, 끝에 나오는 값 4개를 알려 주면 된다.

```
어드민 ─ 업로드 허가서 요청 → 백엔드(관리자 확인, 형식·정확한 크기를 서명한 PUT 주소)
어드민 ─ 파일 직접 전송 → S3 버킷(서울, 비공개)
방문자 → images.sonic-portfolio.com(CloudFront) → S3
```

## 1. S3 버킷 만들기 (약 5분)

S3 → **Create bucket**

| 항목 | 값 |
|---|---|
| Region | **Asia Pacific (Seoul) ap-northeast-2** |
| Bucket name | `sonic-portfolio-images` (이미 쓰이면 `sonic-portfolio-images-2026` 등) |
| Object Ownership | ACLs disabled (기본값) |
| Block Public Access | **4개 모두 체크(차단)** — 버킷은 비공개, 공개는 CloudFront로만 |
| Versioning | Disable (기본값) |
| Encryption | SSE-S3 (기본값) |

만든 뒤 버킷 → **Permissions** → **Cross-origin resource sharing (CORS)** → Edit, 아래를 붙여 넣는다. 어드민 브라우저가 S3로 직접 파일을 보내기 위한 설정이다.

```json
[
  {
    "AllowedOrigins": ["https://admin.sonic-portfolio.com", "http://localhost:5173"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## 2. 업로드 전용 IAM 사용자 (약 5분)

IAM → Users → **Create user**

1. 이름: `sonic-portfolio-uploader`. 콘솔 접근은 **주지 않는다**.
2. 권한: **Attach policies directly** → 정책은 붙이지 않고 다음 → 사용자 생성.
3. 만든 사용자 → **Permissions** → **Add permissions → Create inline policy** → JSON 탭에 아래를 붙여 넣는다(버킷 이름이 다르면 바꾼다). 이름 `upload-images-only`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": [
        "arn:aws:s3:::sonic-portfolio-images/images/*",
        "arn:aws:s3:::sonic-portfolio-images/dev/*"
      ]
    }
  ]
}
```

- 운영은 `images/`, 로컬 개발은 `dev/` 아래에만 쓸 수 있다. 읽기·삭제 권한은 없다.

4. **Security credentials** → **Create access key** → 용도 **Application running outside AWS** → 생성.
   - Access key ID와 Secret access key를 **비밀번호 관리자에 보관**한다. Secret은 이 화면에서 한 번만 보인다.
   - 채팅·저장소·스크린샷에 남기지 않는다.

## 3. HTTPS 인증서 (ACM, 약 5분 + 발급 대기)

**리전을 반드시 미국 동부(us-east-1, N. Virginia)로 바꾼다.** CloudFront는 이 리전의 인증서만 쓴다.

ACM → **Request certificate** → Public certificate

| 항목 | 값 |
|---|---|
| Domain name | `images.sonic-portfolio.com` |
| Validation | DNS validation |

요청 후 인증서 상세 → **Create records in Route 53** 버튼 → Create records. 몇 분 뒤 상태가 **Issued**가 된다.

## 4. CloudFront 배포 (약 10분 + 배포 대기 5~15분)

CloudFront → **Create distribution**

| 항목 | 값 |
|---|---|
| Origin domain | 목록에서 `sonic-portfolio-images.s3.ap-northeast-2.amazonaws.com` |
| Origin access | **Origin access control settings (recommended)** → **Create new OAC** → 기본값으로 Create |
| Viewer protocol policy | **Redirect HTTP to HTTPS** |
| Allowed HTTP methods | GET, HEAD |
| Cache policy | **CachingOptimized** |
| Web Application Firewall | **Do not enable security protections** (유료라 끈다) |
| Alternate domain name (CNAME) | `images.sonic-portfolio.com` |
| Custom SSL certificate | 3단계에서 만든 인증서 |
| Price class | 한국 방문자가 많으면 **Use all edge locations** |

만든 뒤 화면 위쪽에 **"S3 bucket policy를 업데이트하라"**는 안내와 **Copy policy** 버튼이 나온다.

1. **Copy policy**를 누른다.
2. S3 → 버킷 → **Permissions** → **Bucket policy** → Edit → 붙여 넣고 저장.

이 정책이 있어야 CloudFront만 버킷을 읽을 수 있다.

## 5. Route 53 레코드 (약 2분)

Route 53 → Hosted zones → `sonic-portfolio.com` → **Create record**

| 항목 | 값 |
|---|---|
| Record name | `images` |
| Record type | A |
| Alias | **켬** → Route traffic to **Alias to CloudFront distribution** → 4단계 배포 선택 |

## 6. 확인 (약 2분)

1. S3 버킷에 `images/` 폴더를 만들고 아무 이미지 파일을 `images/test.png`로 올린다(콘솔 업로드).
2. 브라우저에서 `https://images.sonic-portfolio.com/images/test.png` → 이미지가 보이면 성공.
3. 같은 파일을 S3 주소(`https://sonic-portfolio-images.s3.ap-northeast-2.amazonaws.com/images/test.png`)로 열면 **AccessDenied**가 나와야 정상(버킷 비공개).
4. 확인한 테스트 파일은 지워도 된다.

## 7. 알려 줄 값

| 항목 | 예시 |
|---|---|
| 버킷 이름 | `sonic-portfolio-images` |
| 리전 | `ap-northeast-2` |
| 이미지 주소 | `https://images.sonic-portfolio.com` |
| 업로드 키 준비 여부 | "준비됨" (키 값은 알려 주지 않는다) |

키 값은 직접 아래 두 곳에 넣는다(코드 준비가 끝나면 넣을 위치를 다시 안내한다).

- 운영 서버 `~/portfolio/.env`: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- 로컬 `backend/.env`: 같은 두 값(로컬 업로드는 `dev/` 아래로 저장된다)

## 8. 비용 예산

S3와 CloudFront 비용이 생기면 다음 날부터 Budgets의 서비스 목록에 보인다. `sonic-portfolio-infra-monthly` 예산의 Service 필터에 **Amazon Simple Storage Service**와 **Amazon CloudFront**를 더한다.
