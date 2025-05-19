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
    <main>
      <div className="container">
        {/* 헤더 */}
        <header className="header">
          <h1 className="header-title">
            <FiMail className="icon" /> 
            <span>GPT 기반 이메일 자동 생성 시스템</span>
          </h1>
          <p className="header-subtitle">
            당신의 말투를 학습하여 정확하고 효과적인 이메일을 자동으로 생성해드립니다.
          </p>
        </header>

        {/* 메인 콘텐츠 (좌우 분할) */}
        <div className="main-content">
          {/* 왼쪽 패널: 입력 폼 */}
          <div className="panel">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="card">
                {/* 말투 학습 섹션 */}
                <div className="section">
                  <div 
                    className="section-header"
                    onClick={() => toggleSection('styleText')}
                  >
                    <h2 className="section-title">
                      <FiUser className="icon" /> 1. 사용자 말투 학습
                    </h2>
                    {expandedSection !== 'styleText' && expandedSection !== 'both' ? (
                      <FiChevronDown />
                    ) : (
                      <FiChevronUp />
                    )}
                  </div>
                  
                  <div className={`section-content ${(expandedSection === 'styleText' || expandedSection === 'both') ? 'visible' : ''}`}>
                    <p className="section-description">
                      이전에 작성한 이메일이나 글을 입력하세요. 시스템이 사용자의 말투를 학습합니다.
                    </p>
                    
                    <div className="form-group">
                      <label htmlFor="styleText" className="form-label">
                        이전 이메일 또는 텍스트 샘플
                      </label>
                      <textarea
                        id="styleText"
                        className="form-textarea"
                        rows={6}
                        placeholder="작성하신 이메일이나 텍스트를 복사하여 붙여넣으세요..."
                        {...register('styleText', { required: '말투 학습을 위한 텍스트가 필요합니다' })}
                      ></textarea>
                      {errors.styleText && (
                        <p className="form-error">{errors.styleText.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 구분선 */}
                <div className="divider"></div>
                
                {/* 이메일 생성 섹션 */}
                <div className="section">
                  <div 
                    className="section-header"
                    onClick={() => toggleSection('emailOptions')}
                  >
                    <h2 className="section-title">
                      <FiMessageSquare className="icon" /> 2. 이메일 생성 옵션
                    </h2>
                    {expandedSection !== 'emailOptions' && expandedSection !== 'both' ? (
                      <FiChevronDown />
                    ) : (
                      <FiChevronUp />
                    )}
                  </div>
                  
                  <div className={`section-content ${(expandedSection === 'emailOptions' || expandedSection === 'both') ? 'visible' : ''}`}>
                    <p className="section-description">
                      작성할 이메일 유형과 목적을 입력하세요. 시스템이 학습된 말투로 이메일을 생성합니다.
                    </p>
                    
                    <div className="form-group">
                      <label className="form-label">
                        이메일 유형
                      </label>
                      <div className="radio-group">
                        <label className={`radio-card ${emailType === 'first' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            className="radio-input"
                            value="first"
                            {...register('emailType', { required: true })}
                            defaultChecked
                          />
                          <div className="radio-card-content">
                            <div className="radio-indicator">
                              {emailType === 'first' && <div className="radio-indicator-dot"></div>}
                            </div>
                            <div>
                              <span className="radio-label">첫 메일</span>
                              <p className="radio-description">초기 제안, 인사</p>
                            </div>
                          </div>
                        </label>
                        <label className={`radio-card ${emailType === 'reply' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            className="radio-input"
                            value="reply"
                            {...register('emailType', { required: true })}
                          />
                          <div className="radio-card-content">
                            <div className="radio-indicator">
                              {emailType === 'reply' && <div className="radio-indicator-dot"></div>}
                            </div>
                            <div>
                              <span className="radio-label">회신 메일</span>
                              <p className="radio-description">답장, 피드백</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="purpose" className="form-label">
                        이메일 목적 / 키워드
                      </label>
                      <input
                        id="purpose"
                        type="text"
                        className="form-input"
                        placeholder="예: 미팅 제안, 자료 요청, 협업 제안..."
                        {...register('purpose', { required: '이메일 목적이 필요합니다' })}
                      />
                      {errors.purpose && (
                        <p className="form-error">{errors.purpose.message}</p>
                      )}
                    </div>
                    
                    {emailType === 'reply' && (
                      <div className="form-group animate-fade-in">
                        <label htmlFor="previousEmail" className="form-label">
                          이전 이메일 내용
                        </label>
                        <textarea
                          id="previousEmail"
                          className="form-textarea"
                          rows={4}
                          placeholder="답장할 이전 이메일 내용을 붙여넣으세요..."
                          {...register('previousEmail')}
                        ></textarea>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 생성 버튼 */}
                <div className="form-group">
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        이메일 생성 중...
                      </>
                    ) : (
                      <>
                        <FiSend className="icon" />
                        이메일 생성하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* 오른쪽 패널: 결과 */}
          <div className="panel" ref={emailRef}>
            {generatedEmail ? (
              <div className="card">
                <h2 className="section-title">
                  <FiMail className="icon" /> 생성된 이메일
                </h2>
                <div className="result-container">
                  {generatedEmail}
                </div>
                
                {isEditing ? (
                  <div className="animate-fade-in">
                    <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
                      <h3 className="form-label">수정 요청</h3>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        placeholder="어떻게 수정하면 좋을지 자세히 설명해주세요..."
                        {...registerEdit('editSuggestion', { required: '수정 내용이 필요합니다' })}
                      ></textarea>
                      {editErrors.editSuggestion && (
                        <p className="form-error">{editErrors.editSuggestion.message}</p>
                      )}
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditing(false)}
                        >
                          <FiX className="icon" /> 취소
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isEditLoading}
                        >
                          {isEditLoading ? (
                            <>
                              <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              수정 중...
                            </>
                          ) : (
                            <>
                              <FiCheck className="icon" /> 수정 완료
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="btn-group">
                    <button 
                      className={`btn ${copySuccess ? 'btn-success' : 'btn-secondary'}`}
                      onClick={handleCopy}
                    >
                      {copySuccess ? (
                        <>
                          <FiCheck className="icon" /> 복사됨!
                        </>
                      ) : (
                        <>
                          <FiCopy className="icon" /> 복사하기
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <FiEdit className="icon" /> 수정하기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card placeholder">
                <FiMail size={64} />
                <h3 className="placeholder-title">이메일 생성 대기 중</h3>
                <p>좌측에서 필요한 정보를 입력 후 "이메일 생성하기" 버튼을 눌러주세요.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 푸터 */}
        <footer className="footer">
          <p>© 2023 GPT 기반 이메일 자동 생성 시스템. OpenAI GPT 기술로 구동됩니다.</p>
        </footer>
      </div>
    </main>
  );
}
