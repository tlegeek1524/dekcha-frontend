import React, { useState } from 'react';
import { Plus, FileText, Settings, Trash2, Edit3, Save, X, Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Custom Alert Component
const CustomAlert = ({ isOpen, onClose, type = 'info', title, message, confirmText = 'ตกลง', onConfirm }) => {
  if (!isOpen) return null;

  const alertStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      buttonBg: 'bg-blue-600 hover:bg-blue-700'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100',
      titleColor: 'text-amber-800',
      messageColor: 'text-amber-700',
      buttonBg: 'bg-amber-600 hover:bg-amber-700'
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
      titleColor: 'text-emerald-800',
      messageColor: 'text-emerald-700',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700'
    }
  };

  const style = alertStyles[type];

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-100">
        <div className="animate-bounce-in">
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bounce-in {
                0% {
                  opacity: 0;
                  transform: scale(0.8) translateY(-10px);
                }
                60% {
                  opacity: 1;
                  transform: scale(1.02) translateY(0);
                }
                100% {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
              .animate-bounce-in {
                animation: bounce-in 0.4s ease-out;
              }
            `
          }} />

        {/* Alert Header */}
        <div className={`${style.bg} ${style.border} border-b rounded-t-2xl p-5`}>
          <div className="flex items-center gap-3">
            <div className={`${style.iconBg} rounded-full p-2 flex-shrink-0`}>
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold ${style.titleColor}`}>
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alert Body */}
        <div className="p-5">
          <p className={`${style.messageColor} leading-relaxed`}>
            {message}
          </p>
        </div>

        {/* Alert Footer */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium border border-gray-200"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-5 py-2 ${style.buttonBg} text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
          >
            {confirmText}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

const GroupManagerApp = () => {
  const [groups, setGroups] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlert({ isOpen: false, type: 'info', title: '', message: '' });
  };

  const createGroup = () => {
    const newGroup = {
      id: Date.now(),
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setGroups([...groups, newGroup]);
  };

  const deleteGroup = (groupId) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  const addQuestion = (groupId) => {
    const newQuestion = {
      id: Date.now(),
      text: '',
      order: groups.find(g => g.id === groupId).questions.length + 1,
      createdAt: new Date().toISOString()
    };

    setGroups(groups.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            questions: [...group.questions, newQuestion],
            updatedAt: new Date().toISOString()
          }
        : group
    ));

    setEditingQuestion({ groupId, questionId: newQuestion.id });
  };

  const updateQuestion = (groupId, questionId, newText) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? {
            ...group,
            questions: group.questions.map(q => 
              q.id === questionId 
                ? { ...q, text: newText, updatedAt: new Date().toISOString() }
                : q
            ),
            updatedAt: new Date().toISOString()
          }
        : group
    ));
  };

  const deleteQuestion = (groupId, questionId) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? {
            ...group,
            questions: group.questions.filter(q => q.id !== questionId)
              .map((q, index) => ({ ...q, order: index + 1 })),
            updatedAt: new Date().toISOString()
          }
        : group
    ));
  };

  const handleSubmit = () => {
    if (groups.length === 0) {
      showAlert('warning', 'ไม่มีกลุ่มคำถาม', 'กรุณาสร้างกลุ่มอย่างน้อย 1 กลุ่มก่อนส่ง');
      return;
    }

    // Check if any group has no questions
    const emptyGroups = groups
      .map((group, index) => ({ group, index: index + 1 }))
      .filter(({ group }) => group.questions.length === 0);

    if (emptyGroups.length > 0) {
      const groupNumbers = emptyGroups.map(({ index }) => index).join(', ');
      showAlert('warning', 'กลุ่มที่ยังไม่มีคำถาม', `โปรดกรอกข้อมูลคำถาม กลุ่ม ${groupNumbers} ให้เรียบร้อย`);
      return;
    }

    // Check if all questions have text
    const groupsWithEmptyQuestions = [];
    groups.forEach((group, index) => {
      const hasEmptyQuestions = group.questions.some(q => !q.text.trim());
      if (hasEmptyQuestions) {
        groupsWithEmptyQuestions.push(index + 1);
      }
    });

    if (groupsWithEmptyQuestions.length > 0) {
      const groupNumbers = groupsWithEmptyQuestions.join(', ');
      showAlert('warning', 'มีคำถามที่ยังไม่ได้กรอก', `โปรดกรอกข้อมูลคำถาม กลุ่ม ${groupNumbers} ให้เรียบร้อย`);
      return;
    }

    // Format data for export
    const exportData = {
      summary: {
        totalGroups: groups.length,
        totalQuestions: groups.reduce((sum, group) => sum + group.questions.length, 0),
        exportedAt: new Date().toLocaleString('th-TH'),
        status: 'success'
      },
      data: groups.map((group, index) => ({
        groupNumber: index + 1,
        groupId: group.id,
        groupName: `กลุ่มที่ ${index + 1}`,
        questionCount: group.questions.length,
        createdAt: new Date(group.createdAt).toLocaleString('th-TH'),
        lastModified: new Date(group.updatedAt).toLocaleString('th-TH'),
        questions: group.questions.map(question => ({
          questionNumber: question.order,
          questionId: question.id,
          questionText: question.text.trim(),
          characterCount: question.text.trim().length,
          createdAt: new Date(question.createdAt).toLocaleString('th-TH'),
          lastModified: new Date(question.updatedAt || question.createdAt).toLocaleString('th-TH')
        }))
      }))
    };

    // Create a more detailed console output
    console.group('📊 Export Data Summary');
    console.log('📈 Summary:', exportData.summary);
    console.groupEnd();
    
    console.group('📋 Groups & Questions Data');
    exportData.data.forEach((group, index) => {
      console.group(`🏷️ ${group.groupName} (${group.questionCount} คำถาม)`);
      group.questions.forEach(q => {
        console.log(`   ${q.questionNumber}. ${q.questionText} (${q.characterCount} ตัวอักษร)`);
      });
      console.groupEnd();
    });
    console.groupEnd();
    
    console.log('🔄 Complete JSON Data:', exportData);
    
    showAlert('success', 'ส่งข้อมูลสำเร็จ', `ส่งข้อมูล ${groups.length} กลุ่ม รวม ${exportData.summary.totalQuestions} คำถาม เรียบร้อยแล้ว! ตรวจสอบใน Console`);
  };

  const QuestionInput = ({ groupId, question, isEditing, onSave, onCancel }) => {
    const [text, setText] = useState(question.text);

    const handleSave = () => {
      if (text.trim()) {
        updateQuestion(groupId, question.id, text.trim());
        onSave();
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isEditing) {
      return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="พิมพ์คำถามของคุณที่นี่..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="3"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200 text-sm"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2 group hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer"
        onClick={() => setEditingQuestion({ groupId, questionId: question.id })}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pointer-events-none">
            <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">คำถามที่ {question.order}</span>
            <p className="text-gray-800 mt-2 leading-relaxed">
              {question.text || <span className="text-gray-400 italic">คลิกเพื่อเพิ่มคำถาม</span>}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingQuestion({ groupId, questionId: question.id });
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              title="แก้ไข"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(groupId, question.id);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="ลบ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-indigo-600" />
              จัดการกลุ่มคำถาม
            </h1>
            
            <div className="flex items-center gap-3">
              <button
                onClick={createGroup}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <Plus className="w-5 h-5" />
                สร้างกลุ่ม
              </button>
              
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <FileText className="w-5 h-5" />
                ส่งข้อมูล
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 max-w-7xl mx-auto">
        {groups.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              ยังไม่มีกลุ่มคำถาม
            </h3>
            <p className="text-gray-500 mb-8">
              เริ่มต้นด้วยการสร้างกลุ่มแรกของคุณ
            </p>
            <button
              onClick={createGroup}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-lg"
            >
              <Plus className="w-6 h-6" />
              สร้างกลุ่มแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">กลุ่มที่ {index + 1}</h3>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                      title="ลบกลุ่ม"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-indigo-100 text-sm mt-2">
                    จำนวนคำถาม: {group.questions.length} ข้อ
                  </p>
                </div>

                {/* Card Body - Questions */}
                <div className="p-6">
                  <div className="max-h-96 overflow-y-auto mb-4">
                    {group.questions.map((question) => (
                      <QuestionInput
                        key={question.id}
                        groupId={group.id}
                        question={question}
                        isEditing={editingQuestion?.groupId === group.id && editingQuestion?.questionId === question.id}
                        onSave={() => setEditingQuestion(null)}
                        onCancel={() => setEditingQuestion(null)}
                      />
                    ))}
                  </div>

                  {/* Add Question Button */}
                  <button
                    onClick={() => addQuestion(group.id)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    เพิ่มคำถาม
                  </button>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6">
                  <div className="text-xs text-gray-500 text-center">
                    อัปเดตล่าสุด: {new Date(group.updatedAt).toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {groups.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-600">
              <div>กลุ่ม: <span className="font-bold text-indigo-600">{groups.length}</span></div>
              <div>คำถาม: <span className="font-bold text-emerald-600">
                {groups.reduce((sum, group) => sum + group.questions.length, 0)}
              </span></div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Component */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
};

export default GroupManagerApp;