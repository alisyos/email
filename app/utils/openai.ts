// 이 파일은 클라이언트에서 API 라우트를 호출하기 위한 유틸리티입니다.
export const createEmail = async ({
  styleText,
  emailType,
  purpose,
  previousEmail,
  editSuggestion
}: {
  styleText: string;
  emailType: 'first' | 'reply' | 'edit';
  purpose: string;
  previousEmail?: string;
  editSuggestion?: string;
}) => {
  try {
    // 서버 API 라우트 호출
    const response = await fetch('/api/generate-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        styleText,
        emailType,
        purpose,
        previousEmail,
        editSuggestion
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '이메일 생성에 실패했습니다.');
    }

    const data = await response.json();
    return data.email;
  } catch (error) {
    console.error('이메일 생성 중 오류 발생:', error);
    throw new Error('이메일 생성에 실패했습니다.');
  }
}; 