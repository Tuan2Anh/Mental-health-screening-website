import Link from "next/link";
import { ArrowRight, Brain, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="py-12 md:py-24 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
        <div className="w-full md:w-1/2">
          <h1 className="mb-4">
            Thấu Hiểu Tâm Trí <br /> Chữa Lành Tâm Hồn
          </h1>
          <p className="mb-8" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
            Nền tảng sàng lọc tâm lý và kết nối chuyên gia hàng đầu. Hãy để chúng tôi lắng nghe bạn.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
            <Link href="/test-screening" className="btn btn-primary hover-scale">
              <Brain size={20} style={{ marginRight: '0.5rem' }} />
              Làm Bài Test Ngay
            </Link>
            <Link href="/about" className="btn btn-outline hover-scale">
              Tìm Hiểu Thêm
            </Link>
          </div>
        </div>

        {/* Abstract Visual / Illustration Placeholder */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="card hover-scale" style={{ width: '100%', maxWidth: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))' }}>
            {/* You could place a 3D spline or image here */}
            <Brain size={120} className="text-indigo-500 opacity-80" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-center mb-12">Tại Sao Chọn PsychoHealth?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center hover-scale">
            <div className="flex justify-center mb-4">
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <Brain size={32} className="text-indigo-400" />
              </div>
            </div>
            <h3>Sàng Lọc Khoa Học</h3>
            <p className="mt-4">
              Các bài test được chuẩn hóa dựa trên các thang đo tâm lý uy tín quốc tế (DASS-21, BECK, ...).
            </p>
          </div>

          <div className="card text-center hover-scale">
            <div className="flex justify-center mb-4">
              <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <Shield size={32} className="text-pink-400" />
              </div>
            </div>
            <h3>Bảo Mật Tuyệt Đối</h3>
            <p className="mt-4">
              Thông tin và kết quả của bạn được mã hóa an toàn. Chỉ bạn và chuyên gia mới có thể xem.
            </p>
          </div>

          <div className="card text-center hover-scale">
            <div className="flex justify-center mb-4">
              <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <Clock size={32} className="text-green-400" />
              </div>
            </div>
            <h3>Hỗ Trợ 24/7</h3>
            <p className="mt-4">
              Đặt lịch tư vấn dễ dàng với đội ngũ chuyên gia tâm lý giàu kinh nghiệm.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 mb-8">
        <div className="card text-center" style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))' }}>
          <h2 className="mb-4">Bạn Đang Cảm Thấy Bất Ổn?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Đừng ngần ngại tìm kiếm sự giúp đỡ. Một bài test nhỏ có thể là bước khởi đầu cho hành trình chữa lành.
          </p>
          <Link href="/test-screening" className="btn btn-primary">
            Bắt Đầu Sàng Lọc <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
          </Link>
        </div>
      </section>
    </div>
  );
}
