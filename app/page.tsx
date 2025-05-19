'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiSend, FiEdit, FiCheck, FiX, FiMessageSquare, FiCopy, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { createEmail } from './utils/openai';

type EmailFormData = {
  styleText: string;
  emailType: 'first' | 'reply' | 'edit';
  purpose: string;
  previousEmail?: string;
};

type EditFormData = {
  editSuggestion: string;
};

export default function Home() {
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<'styleText' | 'emailOptions' | 'both'>('both');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EmailFormData>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, formState: { errors: editErrors } } = useForm<EditFormData>();

  const emailType = watch('emailType');
  const emailRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: 'styleText' | 'emailOptions') => {
    if (expandedSection === section) {
      setExpandedSection('both');
    } else {
      setExpandedSection(section);
    }
  };

  const handleCopy = async () => {
    try {
      if (generatedEmail) {
        await navigator.clipboard.writeText(generatedEmail);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  async function onSubmit(data: EmailFormData) {
    setIsLoading(true);
    
    try {
      const emailContent = await createEmail({
        styleText: data.styleText,
        emailType: data.emailType,
        purpose: data.purpose,
        previousEmail: data.previousEmail
      });

      setGeneratedEmail(emailContent);
      setIsEditing(false);
    } catch (error) {
      console.error('이메일 생성 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitEdit(data: EditFormData) {
    setIsEditLoading(true);
    
    try {
      const editedEmailContent = await createEmail({
        styleText: "",  // 기존 말투는 이미 반영되어 있으므로 빈 값 전달
        emailType: "edit", // 편집용 특수 타입
        purpose: "이메일 수정",
        previousEmail: generatedEmail,
        editSuggestion: data.editSuggestion
      });

      setGeneratedEmail(editedEmailContent);
      setIsEditing(false);
    } catch (error) {
      console.error('이메일 수정 중 오류 발생:', error);
    } finally {
      setIsEditLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center text-gray-800">
            <FiMail className="mr-3 text-primary" size={32} /> 
            <span className="text-primary">GPT 기반 이메일 자동 생성 시스템</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            당신의 말투를 학습하여 정확하고 효과적인 이메일을 자동으로 생성해드립니다.
          </p>
        </header>

        {/* 메인 콘텐츠 (좌우 분할) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 왼쪽 패널: 입력 폼 */}
          <div className="lg:w-1/2">
            <form onSubmit={handleSubmit(onSubmit)} className="sticky top-6">
              <div className="bg-white rounded-xl shadow-lg p-6 card-shadow">
                {/* 말투 학습 섹션 */}
                <div className="mb-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('styleText')}
                  >
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FiUser className="mr-2 text-primary" /> 1. 사용자 말투 학습
                    </h2>
                    {expandedSection !== 'styleText' && expandedSection !== 'both' ? (
                      <FiChevronDown className="text-gray-500" />
                    ) : (
                      <FiChevronUp className="text-gray-500" />
                    )}
                  </div>
                  
                  {(expandedSection === 'styleText' || expandedSection === 'both') && (
                    <div className="mt-4 animate-fade-in">
                      <p className="mb-4 text-gray-600">
                        이전에 작성한 이메일이나 글을 입력하세요. 시스템이 사용자의 말투를 학습합니다.
                      </p>
                      
                      <div className="mb-4">
                        <label htmlFor="styleText" className="block text-sm font-medium mb-2 text-gray-700">
                          이전 이메일 또는 텍스트 샘플
                        </label>
                        <textarea
                          id="styleText"
                          className="w-full rounded-lg border-gray-300 shadow-sm focus-effect p-3"
                          rows={6}
                          placeholder="작성하신 이메일이나 텍스트를 복사하여 붙여넣으세요..."
                          {...register('styleText', { required: '말투 학습을 위한 텍스트가 필요합니다' })}
                        ></textarea>
                        {errors.styleText && (
                          <p className="mt-1 text-sm text-red-600">{errors.styleText.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 구분선 */}
                <div className="border-t border-gray-200 my-4"></div>
                
                {/* 이메일 생성 섹션 */}
                <div className="mb-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => toggleSection('emailOptions')}
                  >
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <FiMessageSquare className="mr-2 text-primary" /> 2. 이메일 생성 옵션
                    </h2>
                    {expandedSection !== 'emailOptions' && expandedSection !== 'both' ? (
                      <FiChevronDown className="text-gray-500" />
                    ) : (
                      <FiChevronUp className="text-gray-500" />
                    )}
                  </div>
                  
                  {(expandedSection === 'emailOptions' || expandedSection === 'both') && (
                    <div className="mt-4 animate-fade-in">
                      <p className="mb-4 text-gray-600">
                        작성할 이메일 유형과 목적을 입력하세요. 시스템이 학습된 말투로 이메일을 생성합니다.
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          이메일 유형
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className={`relative border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors ${emailType === 'first' ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>
                            <input
                              type="radio"
                              className="absolute opacity-0"
                              value="first"
                              {...register('emailType', { required: true })}
                              defaultChecked
                            />
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${emailType === 'first' ? 'border-primary' : 'border-gray-300'}`}>
                                {emailType === 'first' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                              </div>
                              <div>
                                <span className="font-medium block">첫 메일</span>
                                <span className="text-sm text-gray-500">초기 제안, 인사</span>
                              </div>
                            </div>
                          </label>
                          <label className={`relative border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors ${emailType === 'reply' ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>
                            <input
                              type="radio"
                              className="absolute opacity-0"
                              value="reply"
                              {...register('emailType', { required: true })}
                            />
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${emailType === 'reply' ? 'border-primary' : 'border-gray-300'}`}>
                                {emailType === 'reply' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                              </div>
                              <div>
                                <span className="font-medium block">회신 메일</span>
                                <span className="text-sm text-gray-500">답장, 피드백</span>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="purpose" className="block text-sm font-medium mb-2 text-gray-700">
                          이메일 목적 / 키워드
                        </label>
                        <input
                          id="purpose"
                          type="text"
                          className="w-full rounded-lg border-gray-300 shadow-sm focus-effect p-3"
                          placeholder="예: 미팅 제안, 자료 요청, 협업 제안..."
                          {...register('purpose', { required: '이메일 목적이 필요합니다' })}
                        />
                        {errors.purpose && (
                          <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
                        )}
                      </div>
                      
                      {emailType === 'reply' && (
                        <div className="mb-4 animate-fade-in">
                          <label htmlFor="previousEmail" className="block text-sm font-medium mb-2 text-gray-700">
                            이전 이메일 내용
                          </label>
                          <textarea
                            id="previousEmail"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus-effect p-3"
                            rows={4}
                            placeholder="답장할 이전 이메일 내용을 붙여넣으세요..."
                            {...register('previousEmail')}
                          ></textarea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 생성 버튼 */}
                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient text-white rounded-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-md transition-all btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        이메일 생성 중...
                      </>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        이메일 생성하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* 오른쪽 패널: 결과 */}
          <div className="lg:w-1/2" ref={emailRef}>
            {generatedEmail ? (
              <div className="bg-white rounded-xl shadow-lg p-6 card-shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <FiMail className="mr-2 text-primary" /> 생성된 이메일
                </h2>
                <div className="bg-gray-50 p-5 rounded-lg whitespace-pre-wrap border border-gray-200 mb-6 text-gray-700">
                  {generatedEmail}
                </div>
                
                {isEditing ? (
                  <div className="mt-6 animate-fade-in">
                    <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">수정 요청</h3>
                      <textarea
                        className="w-full rounded-lg border-gray-300 shadow-sm focus-effect p-4 mb-4"
                        rows={4}
                        placeholder="어떻게 수정하면 좋을지 자세히 설명해주세요..."
                        {...registerEdit('editSuggestion', { required: '수정 내용이 필요합니다' })}
                      ></textarea>
                      {editErrors.editSuggestion && (
                        <p className="mt-1 text-sm text-red-600 mb-3">{editErrors.editSuggestion.message}</p>
                      )}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          onClick={() => setIsEditing(false)}
                        >
                          <FiX className="mr-2" /> 취소
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                          disabled={isEditLoading}
                        >
                          {isEditLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              수정 중...
                            </>
                          ) : (
                            <>
                              <FiCheck className="mr-2" /> 수정 완료
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button 
                      className={`inline-flex items-center px-4 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${copySuccess ? 'bg-green-500 text-white focus:ring-green-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'}`}
                      onClick={handleCopy}
                    >
                      {copySuccess ? (
                        <>
                          <FiCheck className="mr-2" /> 복사됨!
                        </>
                      ) : (
                        <>
                          <FiCopy className="mr-2" /> 복사하기
                        </>
                      )}
                    </button>
                    <button 
                      className="inline-flex items-center px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-colors"
                      onClick={() => setIsEditing(true)}
                    >
                      <FiEdit className="mr-2" /> 수정하기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 card-shadow h-full flex flex-col items-center justify-center text-center text-gray-400 min-h-[400px]">
                <FiMail size={64} className="mb-4 opacity-30" />
                <h3 className="text-xl font-medium mb-2">이메일 생성 대기 중</h3>
                <p>좌측에서 필요한 정보를 입력 후 "이메일 생성하기" 버튼을 눌러주세요.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 푸터 */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2023 GPT 기반 이메일 자동 생성 시스템. OpenAI GPT 기술로 구동됩니다.</p>
        </footer>
      </div>
    </main>
  );
}
