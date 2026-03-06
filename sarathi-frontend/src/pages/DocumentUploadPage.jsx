import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, Loader2, X, Sparkles } from 'lucide-react';
import { getUploadUrl, analyzeDocument } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCitizen } from '../context/CitizenContext';
import { useToast } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';

const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card', labelHi: 'आधार कार्ड', icon: '🪪' },
  { value: 'income_cert', label: 'Income Certificate', labelHi: 'आय प्रमाण पत्र', icon: '📄' },
  { value: 'ration_card', label: 'Ration Card', labelHi: 'राशन कार्ड', icon: '🏠' },
  { value: 'job_card', label: 'MGNREGS Job Card', labelHi: 'मनरेगा जॉब कार्ड', icon: '💼' },
  { value: 'bank_statement', label: 'Bank Statement', labelHi: 'बैंक स्टेटमेंट', icon: '🏦' },
];

const FIELD_LABELS = {
  name: 'Name',
  age: 'Age',
  gender: 'Gender',
  aadhaarLast4: 'Aadhaar Last 4',
  address: 'Address',
  income: 'Monthly Income (₹)',
  issuingAuthority: 'Issuing Authority',
  familySize: 'Family Size',
  rationCardType: 'Ration Card Type',
  state: 'State',
  mgnregaJobCardNumber: 'Job Card Number',
  panchayatName: 'Panchayat',
  village: 'Village',
};

function ConfidenceBadge({ score }) {
  const color = score >= 85 ? 'text-success bg-success-light' : score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-danger bg-danger/10';
  return (
    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {score}%
    </span>
  );
}

function DocumentUploadPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { updateProfile, saveCurrentProfile, eligibleSchemes } = useCitizen();
  const { addToast } = useToast();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const fileInputRef = useRef(null);
  const defaultType = searchParams.get('type') || 'aadhaar';

  const [documentType, setDocumentType] = useState(defaultType);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStep, setUploadStep] = useState('idle'); // idle | uploading | analyzing | done | error
  const [extractedFields, setExtractedFields] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState({});
  const [applied, setApplied] = useState(false);

  const citizenId = user?.sub || user?.userId || '';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('File must be under 5MB', 'error');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
      addToast('Only JPG, PNG, or PDF files are allowed', 'error');
      return;
    }
    setSelectedFile(file);
    setExtractedFields(null);
    setApplied(false);
    setUploadStep('idle');
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !citizenId) return;

    setUploadStep('uploading');
    try {
      // Step 1: Get pre-signed URL
      const { uploadUrl, s3Key } = await getUploadUrl(documentType, selectedFile.name, citizenId);

      // Step 2: PUT file directly to S3
      const putResp = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
      });
      if (!putResp.ok) throw new Error('S3 upload failed');

      // Step 3: Analyze with Textract + Comprehend
      setUploadStep('analyzing');
      const result = await analyzeDocument(s3Key, documentType, citizenId);
      setExtractedFields(result.extractedFields || {});
      setConfidenceScores(result.confidenceScores || {});
      setUploadStep('done');
    } catch (err) {
      console.error('[DocumentUpload] Error:', err);
      addToast('Upload or analysis failed. Please try again.', 'error');
      setUploadStep('error');
    }
  };

  const handleApplyToProfile = async () => {
    if (!extractedFields || Object.keys(extractedFields).length === 0) return;
    updateProfile(extractedFields);
    try {
      await saveCurrentProfile(eligibleSchemes);
      addToast(isHi ? 'प्रोफ़ाइल अपडेट हो गई!' : 'Profile updated successfully!', 'success');
      setApplied(true);
    } catch {
      addToast(isHi ? 'सहेजने में विफल' : 'Save failed — changes stored locally', 'error');
      setApplied(true);
    }
  };

  const selectedDocType = DOCUMENT_TYPES.find(d => d.value === documentType);

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-navy py-6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link to="/profile" className="inline-flex items-center gap-1.5 font-body text-sm text-gray-300 hover:text-white mb-3 transition-colors">
            <ArrowLeft size={14} /> {isHi ? 'प्रोफ़ाइल पर वापस' : 'Back to Profile'}
          </Link>
          <h1 className="font-display text-2xl text-white">
            {isHi ? 'स्मार्ट दस्तावेज़ आयात' : 'Smart Document Import'}
          </h1>
          <p className="font-body text-sm text-gray-300 mt-1">
            {isHi
              ? 'दस्तावेज़ अपलोड करें — AI स्वचालित रूप से आपकी प्रोफ़ाइल भर देगा'
              : 'Upload a document — AI automatically extracts and fills your profile'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Document type selector */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-body text-sm font-bold text-gray-900 mb-3">
            {isHi ? 'दस्तावेज़ प्रकार चुनें' : 'Select Document Type'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DOCUMENT_TYPES.map((dt) => (
              <button
                key={dt.value}
                onClick={() => { setDocumentType(dt.value); setSelectedFile(null); setExtractedFields(null); setUploadStep('idle'); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border font-body text-xs font-medium transition-all ${
                  documentType === dt.value
                    ? 'border-saffron bg-saffron-pale text-saffron'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{dt.icon}</span>
                {isHi ? dt.labelHi : dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-body text-sm font-bold text-gray-900 mb-3">
            {isHi ? 'फ़ाइल अपलोड करें' : 'Upload File'}
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-saffron/40 hover:bg-saffron-pale/30 transition-all"
            >
              <Upload size={24} className="text-gray-400" />
              <div className="text-center">
                <p className="font-body text-sm font-medium text-gray-700">
                  {isHi ? 'फ़ाइल चुनें' : 'Choose a file'}
                </p>
                <p className="font-body text-xs text-gray-400 mt-0.5">JPG, PNG, PDF • Max 5MB</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-off-white border border-gray-200">
              <FileText size={20} className="text-saffron shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="font-body text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => { setSelectedFile(null); setExtractedFields(null); setUploadStep('idle'); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {selectedFile && uploadStep === 'idle' && (
            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleUploadAndAnalyze}
              className="mt-3 w-full h-11 rounded-xl bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {isHi ? 'AI से जानकारी निकालें' : 'Extract Info with AI'}
            </motion.button>
          )}

          {(uploadStep === 'uploading' || uploadStep === 'analyzing') && (
            <div className="mt-3 flex items-center justify-center gap-2 py-3">
              <Loader2 size={18} className="animate-spin text-saffron" />
              <span className="font-body text-sm text-gray-600">
                {uploadStep === 'uploading'
                  ? (isHi ? 'अपलोड हो रहा है...' : 'Uploading...')
                  : (isHi ? 'AI जानकारी निकाल रहा है...' : 'AI extracting information...')}
              </span>
            </div>
          )}

          {uploadStep === 'error' && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20">
              <AlertTriangle size={16} className="text-danger shrink-0" />
              <p className="font-body text-sm text-danger">
                {isHi ? 'विश्लेषण विफल हुआ। पुनः प्रयास करें।' : 'Analysis failed. Please try again.'}
              </p>
            </div>
          )}
        </div>

        {/* Extracted fields */}
        {uploadStep === 'done' && extractedFields && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-success" />
              <h3 className="font-body text-sm font-bold text-gray-900">
                {isHi ? 'निकाली गई जानकारी' : 'Extracted Information'}
              </h3>
              <span className="text-xs font-body text-gray-400 ml-auto">
                {isHi ? `${Object.keys(extractedFields).length} फ़ील्ड` : `${Object.keys(extractedFields).length} fields`}
              </span>
            </div>

            {Object.keys(extractedFields).length === 0 ? (
              <div className="text-center py-4">
                <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
                <p className="font-body text-sm text-gray-500">
                  {isHi ? 'कोई जानकारी नहीं निकाली जा सकी।' : 'No information could be extracted. Try a clearer image.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {Object.entries(extractedFields).map(([key, value]) => {
                    const conf = confidenceScores[key] || 0;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-off-white border border-gray-100">
                        <div>
                          <p className="font-body text-xs text-gray-500 uppercase tracking-wider">
                            {FIELD_LABELS[key] || key}
                          </p>
                          <p className="font-body text-sm font-semibold text-gray-900">{String(value)}</p>
                        </div>
                        {conf > 0 && <ConfidenceBadge score={conf} />}
                      </div>
                    );
                  })}
                </div>

                {!applied ? (
                  <button
                    onClick={handleApplyToProfile}
                    className="w-full h-11 rounded-xl bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    {isHi ? 'प्रोफ़ाइल में जोड़ें' : 'Apply to Profile'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-3 bg-success-light rounded-xl">
                    <CheckCircle size={16} className="text-success" />
                    <span className="font-body text-sm font-medium text-success">
                      {isHi ? 'प्रोफ़ाइल अपडेट हो गई!' : 'Profile updated!'}
                    </span>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default DocumentUploadPage;
