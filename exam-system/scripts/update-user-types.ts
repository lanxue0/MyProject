import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    // 找到所有userType为'NORMAL'的用户
    const profiles = await prisma.userProfile.findMany({
      where: {
        userType: 'NORMAL',
      },
    });

    console.log(`找到 ${profiles.length} 个需要更新的用户`);

    // 更新为'STUDENT'
    const updateResult = await prisma.userProfile.updateMany({
      where: {
        userType: 'NORMAL',
      },
      data: {
        userType: 'STUDENT',
      },
    });

    console.log(
      `成功更新 ${updateResult.count} 个用户类型从 'NORMAL' 到 'STUDENT'`,
    );
  } catch (error) {
    console.error('更新用户类型时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
