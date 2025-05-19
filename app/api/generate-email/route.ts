import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 기본 모델 설정
const DEFAULT_MODEL = 'gpt-4.1';

export async function POST(request: Request) {
  try {
    const { styleText, emailType, purpose, previousEmail, editSuggestion } = await request.json();

    if (!emailType || !purpose) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 수정 요청인 경우
    if (emailType === 'edit') {
      if (!previousEmail || !editSuggestion) {
        return NextResponse.json(
          { error: '수정 요청을 위한 파라미터가 누락되었습니다.' },
          { status: 400 }
        );
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `당신은 이메일 수정 전문가입니다. 사용자가 제공한 수정 요청에 따라 기존 이메일을 개선해주세요.
                     
                     기존 이메일:
                     ${previousEmail}
                     
                     수정 요청:
                     ${editSuggestion}
                     
                     위 수정 요청을 반영하여 이메일을 자연스럽게 다시 작성해주세요. 사용자의 요청을 최대한 반영하되, 이메일의 전체적인 톤과 스타일은 유지해주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const editedEmail = response.choices[0].message.content;
      return NextResponse.json({ email: editedEmail });
    }
    
    // 일반 이메일 생성 요청
    else {
      if (!styleText) {
        return NextResponse.json(
          { error: '말투 학습을 위한 텍스트가 필요합니다.' },
          { status: 400 }
        );
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `당신은 이메일 작성 전문가입니다. 제공된 텍스트 샘플을 분석하여 사용자의 말투와 글쓰기 스타일을 학습하고, 
                      그 스타일을 반영한 이메일을 작성해주세요. 이메일은 ${emailType === 'first' ? '처음 보내는 메일' : '회신 메일'}이며, 
                      목적은 "${purpose}"입니다.
                      
                      사용자 말투 샘플:
                      ${styleText}
                      
                      ${previousEmail ? `이전 이메일 내용: ${previousEmail}` : ''}
                      
                      최대한 자연스럽게 사용자의 어투, 문장 구조, 인사말, 맺음말 등의 스타일을 반영해서 작성해주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const generatedEmail = response.choices[0].message.content;
      return NextResponse.json({ email: generatedEmail });
    }
  } catch (error) {
    console.error('이메일 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이메일 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 