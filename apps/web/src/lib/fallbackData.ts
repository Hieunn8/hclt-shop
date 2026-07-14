import type { CatalogData } from "./types";

const asset = (name: string, alt: string) => ({
  url: `/assets/${name}`,
  alt,
  width: 1200,
  height: 800
});

export const fallbackData: CatalogData = {
  settings: {
    siteName: "AIVisionary",
    description: "Công cụ AI dành cho nhà sáng tạo nội dung, vận hành kênh và tự động hóa workflow.",
    phone: "0123 456 789",
    email: "support@aivisionary.com",
    zaloUrl: "https://zalo.me/0123456789",
    facebookUrl: "https://facebook.com/aivisionary",
    address: "Ho Chi Minh City, Vietnam",
    promo: {
      active: true,
      text: "Ưu đãi tháng 7: Giảm 20% tất cả Key AI - áp dụng đến hết 31/07",
      href: "/bang-gia"
    }
  },
  categories: [
    { id: "cat-tts", slug: "text-to-speech", name: "Text to Speech", description: "Tạo giọng đọc tự nhiên cho video và podcast." },
    { id: "cat-stt", slug: "speech-to-text", name: "Speech to Text", description: "Chuyển âm thanh thành phụ đề và kịch bản." },
    { id: "cat-reup", slug: "reup-video", name: "Reup Video", description: "Tối ưu quy trình biên tập và đăng lại video." },
    { id: "cat-film", slug: "review-phim-ai", name: "Review Phim AI", description: "Tạo nội dung review phim nhanh và nhất quán." },
    { id: "cat-key", slug: "key-code", name: "Key & Code", description: "License, prompt pack và script hỗ trợ." }
  ],
  products: [
    {
      id: "p1",
      slug: "auto-reup-master",
      name: "Auto Reup Master",
      shortDescription: "Tự động hóa quy trình reup video với AI caption, lịch đăng và kiểm tra trùng lặp.",
      description: "Auto Reup Master giúp creator gom nguồn, tạo phụ đề, biến thể tiêu đề và xuất lịch đăng phù hợp cho nhiều nền tảng. Công cụ ưu tiên kiểm soát thủ công ở các bước quan trọng để tránh spam và bảo vệ thương hiệu.",
      categorySlug: "reup-video",
      price: 1290000,
      compareAtPrice: 1690000,
      badge: "bestseller",
      rating: 4.8,
      reviewCount: 128,
      media: [asset("product-auto-reup.svg", "Giao diện Auto Reup Master"), asset("product-workflow.svg", "Workflow AI video"), { ...asset("product-video.svg", "Video demo Auto Reup Master"), type: "video" }],
      features: ["Tạo caption đa nền tảng", "Lọc video trùng lặp", "Lịch đăng thông minh", "Xuất báo cáo chiến dịch"],
      usageSteps: ["Kết nối nguồn nội dung", "Chọn template kênh", "Duyệt caption và thumbnail", "Xuất lịch đăng hoặc tải file"],
      purchaseUrl: "/lien-he?product=auto-reup-master",
      zaloUrl: "https://zalo.me/0123456789",
      publishedAt: "2026-07-01T00:00:00.000Z"
    },
    {
      id: "p2",
      slug: "ai-voice-generator-pro",
      name: "AI Voice Generator Pro",
      shortDescription: "Tạo giọng đọc tiếng Việt rõ, giàu cảm xúc cho video bán hàng và giáo dục.",
      description: "Bộ công cụ voice-over hỗ trợ nhiều phong cách đọc, quản lý dự án và xuất file tối ưu cho editor.",
      categorySlug: "text-to-speech",
      price: 890000,
      badge: "featured",
      rating: 4.7,
      reviewCount: 86,
      media: [asset("product-voice.svg", "AI Voice Generator Pro")],
      features: ["Giọng Việt tự nhiên", "Batch export", "Preset cảm xúc", "Tối ưu cho video ngắn"],
      usageSteps: ["Nhập kịch bản", "Chọn giọng", "Tinh chỉnh tốc độ", "Xuất audio"],
      purchaseUrl: "/lien-he?product=ai-voice-generator-pro",
      publishedAt: "2026-06-20T00:00:00.000Z"
    },
    {
      id: "p3",
      slug: "deep-transcribe",
      name: "Deep Transcribe",
      shortDescription: "Chuyển audio/video thành text, tóm tắt ý chính và tạo subtitle.",
      description: "Deep Transcribe phù hợp cho creator cần tái sử dụng nội dung dài thành script, blog và short clip.",
      categorySlug: "speech-to-text",
      price: 690000,
      badge: "new",
      rating: 4.6,
      reviewCount: 41,
      media: [asset("product-transcribe.svg", "Deep Transcribe")],
      features: ["Nhận diện tiếng Việt", "Tách speaker", "Xuất SRT", "Tóm tắt bằng AI"],
      usageSteps: ["Upload file", "Chọn ngôn ngữ", "Kiểm tra transcript", "Xuất định dạng"],
      purchaseUrl: "/lien-he?product=deep-transcribe",
      publishedAt: "2026-07-08T00:00:00.000Z"
    },
    {
      id: "p4",
      slug: "film-review-ai",
      name: "Film Review AI",
      shortDescription: "Tạo dàn ý review phim, voice script và hook cho video ngắn.",
      description: "Film Review AI hỗ trợ tạo cấu trúc kể chuyện, phân cảnh và lời dẫn có kiểm soát.",
      categorySlug: "review-phim-ai",
      price: 790000,
      rating: 4.5,
      reviewCount: 32,
      media: [asset("product-film.svg", "Film Review AI")],
      features: ["Dàn ý theo nhịp phim", "Hook video ngắn", "Prompt voice-over", "Checklist bản quyền"],
      usageSteps: ["Nhập nội dung phim", "Chọn phong cách", "Duyệt dàn ý", "Xuất script"],
      purchaseUrl: "/lien-he?product=film-review-ai",
      publishedAt: "2026-05-15T00:00:00.000Z"
    }
  ],
  heroSlides: [
    { id: "h1", title: "AI Voice Generator Pro", description: "Giọng đọc tiếng Việt tự nhiên cho video bán hàng, giáo dục và podcast.", productSlug: "ai-voice-generator-pro", image: asset("hero-voice.svg", "AI Voice Generator Pro") },
    { id: "h2", title: "Auto Reup Master", description: "Tự động hóa caption, lịch đăng và kiểm tra trùng lặp cho creator.", productSlug: "auto-reup-master", image: asset("hero-reup.svg", "Auto Reup Master") },
    { id: "h3", title: "Deep Transcribe", description: "Biến audio/video thành transcript, subtitle và nội dung tái sử dụng.", productSlug: "deep-transcribe", image: asset("hero-transcribe.svg", "Deep Transcribe") }
  ],
  testimonials: [
    { id: "t1", name: "Minh Anh", role: "YouTube Creator", quote: "AIVisionary giúp team tôi rút thời gian chuẩn bị video từ vài giờ xuống còn dưới một giờ.", rating: 5 },
    { id: "t2", name: "Quốc Huy", role: "Agency Owner", quote: "Seed content rõ ràng, dễ giao cho editor và kiểm soát chất lượng tốt hơn.", rating: 5 },
    { id: "t3", name: "Linh Phạm", role: "TikTok Seller", quote: "Giọng đọc và caption ổn định, không còn phải ghép nhiều công cụ rời rạc.", rating: 4.5 }
  ],
  faqs: [
    { id: "f1", question: "Tôi có thể dùng thử trước khi mua không?", answer: "Có. Hãy gửi nhu cầu qua form liên hệ hoặc Zalo để được cấp demo phù hợp." },
    { id: "f2", question: "AIVisionary có hỗ trợ tiếng Việt không?", answer: "Có. Giao diện và seed content mặc định dùng tiếng Việt, giá hiển thị bằng VND." },
    { id: "f3", question: "Có thanh toán tự động trên website không?", answer: "Giai đoạn 1 chưa có thanh toán tự động. CTA sẽ dẫn đến liên hệ hoặc URL mua hàng do CMS cấu hình." },
    { id: "f4", question: "Dữ liệu form có gửi thẳng vào CMS không?", answer: "Không. Form đi qua Next.js route handler để validate, rate-limit và chống spam trước." },
    { id: "f5", question: "Có thể deploy trên VPS không?", answer: "Có. Repository có Docker Compose, Nginx config và script vận hành." }
  ],
  blogPosts: [
    { id: "b1", slug: "toi-uu-workflow-content-ai", title: "Tối ưu workflow content AI cho creator", excerpt: "Cách chia bước để vừa nhanh vừa giữ chất lượng biên tập.", content: "Một workflow tốt nên tách rõ bước thu thập nguồn, tạo bản nháp, duyệt thủ công và xuất bản. AI nên hỗ trợ tốc độ, không thay thế trách nhiệm kiểm duyệt.", category: "Hướng dẫn", author: "AIVisionary Team", publishedAt: "2026-07-01T00:00:00.000Z", image: asset("blog-workflow.svg", "Workflow content AI") },
    { id: "b2", slug: "chon-giong-doc-video-ngan", title: "Chọn giọng đọc cho video ngắn", excerpt: "Những tiêu chí giúp giọng đọc rõ, tự nhiên và hợp thương hiệu.", content: "Giọng đọc tốt cần rõ phụ âm, tốc độ vừa phải, có khoảng nghỉ và phù hợp ngữ cảnh. Hãy test trên thiết bị di động trước khi xuất hàng loạt.", category: "Voice AI", author: "AIVisionary Team", publishedAt: "2026-06-24T00:00:00.000Z", image: asset("blog-voice.svg", "Voice AI") },
    { id: "b3", slug: "checklist-reup-video-an-toan", title: "Checklist reup video an toàn", excerpt: "Những điểm cần kiểm tra trước khi đăng lại hoặc biến thể nội dung.", content: "Luôn kiểm tra bản quyền, nguồn, watermark, thông tin nhạy cảm và tính phù hợp với kênh. Tự động hóa chỉ nên chạy sau bước duyệt.", category: "Reup Video", author: "AIVisionary Team", publishedAt: "2026-06-18T00:00:00.000Z", image: asset("blog-reup.svg", "Checklist reup video") }
  ],
  policies: [
    { id: "pol1", slug: "bao-mat", title: "Chính sách bảo mật", content: "Chúng tôi chỉ thu thập thông tin cần thiết để phản hồi yêu cầu và không bán dữ liệu cá nhân." },
    { id: "pol2", slug: "dieu-khoan", title: "Điều khoản dịch vụ", content: "Người dùng chịu trách nhiệm với nội dung đầu vào và cách sử dụng công cụ AI." },
    { id: "pol3", slug: "hoan-tien", title: "Chính sách hoàn tiền", content: "Yêu cầu hoàn tiền được xử lý theo từng gói và tình trạng kích hoạt dịch vụ." }
  ],
  reviews: [
    { id: "r1", productSlug: "auto-reup-master", name: "Hoàng Nam", rating: 5, comment: "Tính năng lịch đăng và caption giúp tiết kiệm rất nhiều thời gian.", status: "approved", createdAt: "2026-07-05T00:00:00.000Z" },
    { id: "r2", productSlug: "auto-reup-master", name: "Thảo Vy", rating: 4, comment: "Dễ dùng, phần duyệt thủ công rõ ràng nên yên tâm hơn.", status: "approved", createdAt: "2026-07-06T00:00:00.000Z" },
    { id: "r3", productSlug: "ai-voice-generator-pro", name: "Anh Tú", rating: 5, comment: "Giọng đọc ổn định, xuất file nhanh.", status: "approved", createdAt: "2026-07-03T00:00:00.000Z" }
  ]
};
