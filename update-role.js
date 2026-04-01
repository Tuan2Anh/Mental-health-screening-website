const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'Tuananh@gmail.com';
  
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { 
        role: 'expert',
        specialty: 'Chuyên gia Tâm lý học'
      }
    });
    console.log('--- KẾT QUẢ ---');
    console.log(`Đã cập nhật thành công cho: ${user.full_name}`);
    console.log(`Quyền hiện tại: ${user.role}`);
    console.log(`Chuyên môn: ${user.specialty}`);
    console.log('----------------');
  } catch (error) {
    console.error('LỖI: Không tìm thấy người dùng với email: ' + email);
  } finally {
    await prisma.$disconnect();
  }
}

main();
