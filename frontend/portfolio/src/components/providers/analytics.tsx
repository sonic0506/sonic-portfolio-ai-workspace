import Script from 'next/script';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * GTM 컨테이너. page_view는 GA4 향상된 측정(방문 기록 변경)이 보내고,
 * 블로그 글 읽은 깊이는 DocLayout이 `scroll_depth` 이벤트로 dataLayer에 넣는다.
 */
export function Analytics({ gtmId }: { gtmId: string }) {
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}
