import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Upload,
  UserCheck,
  CheckCircle2,
  FileText,
  Camera,
  MapPin,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { OCCUPATIONS, Occupation, User, UserRole } from '../types';
import { getLiveLocation, getLocationErrorMessage } from '../utils/liveLocation';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  defaultRole?: UserRole;
  userCoords: { lat: number; lng: number };
  userCity: string;
}

const OCCUPATIONS_LIST: readonly Occupation[] = OCCUPATIONS;

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'worker',
  userCoords,
  userCity,
}) => {
  const registrationFormRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [step, setStep] = useState<1 | 2>(1);

  // Common Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState<string>('30');
  const [phone, setPhone] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(userCity && userCity !== 'Location not set' ? userCity : '');
  const [pincode, setPincode] = useState('201301');
  const [profilePic, setProfilePic] = useState<string>('');
  const [registrationCoords, setRegistrationCoords] = useState(userCoords);
  const [registrationAccuracy, setRegistrationAccuracy] = useState<number | null>(null);
  const [registrationCapturedAt, setRegistrationCapturedAt] = useState<number | null>(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [idProofDocument, setIdProofDocument] = useState('Aadhaar_Verification_Doc.pdf');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [backgroundCert, setBackgroundCert] = useState('Police_Clearance_Cert.pdf');

  // Worker specific fields
  const [occupation, setOccupation] = useState<Occupation>('Carpenter');
  const [skillsInput, setSkillsInput] = useState('Modular Kitchens, Teak Furniture, Door Repair');
  const [ratePerHour, setRatePerHour] = useState<string>('350');
  const [ratePerMonth, setRatePerMonth] = useState<string>('28000');
  const [experienceYears, setExperienceYears] = useState<string>('8');
  const [bio, setBio] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingVerification, setPendingVerification] = useState<{ email: string; username: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingPasswordSetup, setPendingPasswordSetup] = useState<{ email: string; token: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole, isOpen]);

  useEffect(() => {
    if (!locationCaptured && userCity && userCity !== 'Location not set' && userCity !== 'Live GPS location') {
      setCity(userCity);
    }
  }, [userCity, locationCaptured]);

  useEffect(() => {
    if (!isOpen) {
      setPendingVerification(null);
      setVerificationCode('');
      setPendingPasswordSetup(null);
      setNewPassword('');
      setPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const captureCurrentLocation = async () => {
    setIsCapturingLocation(true);
    setLocationError('');
    try {
      const coordinates = await getLiveLocation();
      setRegistrationCoords({ lat: coordinates.lat, lng: coordinates.lng });
      setRegistrationAccuracy(coordinates.accuracy);
      setRegistrationCapturedAt(coordinates.capturedAt);
      try {
        const response = await fetch(`/api/location/reverse?lat=${encodeURIComponent(coordinates.lat)}&lng=${encodeURIComponent(coordinates.lng)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.city) setCity(result.city);
          if (result.address) setAddress(result.address);
        } else {
          setLocationError('Location captured. City/Region could not be filled automatically; please enter it manually.');
        }
      } catch {
        setLocationError('Location captured. City/Region could not be filled automatically; please enter it manually.');
      }
      setLocationCaptured(true);
    } catch (error) {
      setLocationError(getLocationErrorMessage(error));
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleProfilePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) {
      setErrorMessage('Upload an image smaller than 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfilePic(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (kind: 'id' | 'background', file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Each document must be smaller than 5 MB.');
      return;
    }
    if (kind === 'id') setIdProofDocument(file.name);
    else setBackgroundCert(file.name);
    setErrorMessage('');
  };

  const verifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingVerification || !/^\d{6}$/.test(verificationCode)) {
      setErrorMessage('कृपया छः अंकों का सत्यापन कूट दर्ज करें।');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerification.email, code: verificationCode }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.passwordSetupToken) {
        setPendingVerification(null);
        const passwordResponse = await fetch('/api/auth/password-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: pendingVerification.email,
            token: String(result.passwordSetupToken),
            password,
          }),
        });
        const passwordResult = await passwordResponse.json();
        if (passwordResponse.ok && passwordResult.success && passwordResult.user) {
          setPassword('');
          setConfirmPassword('');
          onSuccess(passwordResult.user as User);
        } else {
          setPendingPasswordSetup({ email: pendingVerification.email, token: String(result.passwordSetupToken) });
          setNewPassword('');
          setErrorMessage('ईमेल सत्यापित हो गया है, पर खाता पूरा नहीं हो सका। कृपया पुनः प्रयास करें।');
        }
      } else setErrorMessage('सत्यापन पूरा नहीं हो सका। कूट की जाँच करके पुनः प्रयास करें।');
    } catch {
      setErrorMessage('सत्यापन के समय नेटवर्क त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (!pendingVerification) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerification.email }),
      });
      const result = await response.json();
      if (response.ok && result.success) setErrorMessage('नया सत्यापन कूट भेज दिया गया है।');
      else setErrorMessage('नया सत्यापन कूट भेजा नहीं जा सका। कृपया पुनः प्रयास करें।');
    } catch {
      setErrorMessage('कूट भेजते समय नेटवर्क त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setInitialPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingPasswordSetup || newPassword.length < 6) {
      setErrorMessage('गुप्तशब्द कम से कम ६ अक्षरों का होना चाहिए।');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/auth/password-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingPasswordSetup.email, token: pendingPasswordSetup.token, password: newPassword }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.user) {
        setPendingPasswordSetup(null);
        onSuccess(result.user as User);
      } else {
        setErrorMessage('गुप्तशब्द सुरक्षित नहीं किया जा सका। कृपया पुनः प्रयास करें।');
      }
    } catch {
      setErrorMessage('गुप्तशब्द सुरक्षित करते समय नेटवर्क त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (pendingPasswordSetup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#2D2926]">गुप्तशब्द बनाएँ</h2><p className="mt-1 text-xs text-[#8C867E]">ईमेल सत्यापित हो गया है। खाता पूरा करने के लिए गुप्तशब्द बनाएँ।</p></div><button type="button" onClick={onClose} aria-label="बंद करें" className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div>
          <form onSubmit={setInitialPassword} className="space-y-4">
            {errorMessage && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{errorMessage}</p>}
            <label className="block text-xs font-bold text-[#423E3B]">नया गुप्तशब्द<input autoFocus required type="password" minLength={6} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="कम से कम ६ अक्षर" className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm" /></label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'सुरक्षित किया जा रहा है...' : 'गुप्तशब्द बनाकर आगे बढ़ें'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><h2 className="text-xl font-bold text-[#2D2926]">ईमेल सत्यापन</h2><p className="mt-1 text-xs text-[#8C867E]">आपके ईमेल पते पर छः अंकों का कूट भेजा गया है। यह १० मिनट तक मान्य है।</p></div>
            <button type="button" onClick={onClose} aria-label="बंद करें" className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={verifyEmail} className="space-y-4">
            {errorMessage && <p className={`rounded-xl border p-3 text-xs ${errorMessage.startsWith('नया') ? 'border-[#D2E0D0] bg-[#EBF2EA] text-[#5C6E58]' : 'border-red-200 bg-red-50 text-red-700'}`}>{errorMessage}</p>}
            <label className="block text-xs font-bold text-[#423E3B]">सत्यापन कूट<input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em]" /></label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'सत्यापन हो रहा है...' : 'सत्यापित करके आगे बढ़ें'}</button>
            <button type="button" disabled={isSubmitting} onClick={resendVerification} className="w-full text-xs font-bold text-[#8B5E3C] disabled:opacity-50">कूट फिर भेजें</button>
          </form>
        </div>
      </div>
    );
  }

  const handleAadhaarFormat = (val: string) => {
    // Format as 12 digits: XXXX-XXXX-XXXX
    const raw = val.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    for (let i = 0; i < raw.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += raw[i];
    }
    setAadhaarNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const showRegistrationError = (message: string) => {
      setErrorMessage(message);
      requestAnimationFrame(() => registrationFormRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    if (!name.trim() || !username.trim() || !email.trim() || !phone.trim() || !aadhaarNumber.trim()) {
      showRegistrationError('कृपया नाम, उपयोगकर्ता नाम, ईमेल, फोन नंबर और आधार नंबर भरें।');
      return;
    }

    const numericAge = Number(age);
    if (!Number.isInteger(numericAge) || numericAge < 18 || numericAge > 75) {
      showRegistrationError('कृपया १८ से ७५ वर्ष के बीच की सही आयु भरें।');
      return;
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username.trim())) {
      showRegistrationError('उपयोगकर्ता नाम ३ से ३० अक्षरों का होना चाहिए।');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      showRegistrationError('सत्यापन के लिए सही ईमेल पता भरें।');
      return;
    }

    if (password.length < 6) {
      showRegistrationError('गुप्तशब्द कम से कम ६ अक्षरों का होना चाहिए।');
      return;
    }

    if (password !== confirmPassword) {
      showRegistrationError('दोनों गुप्तशब्द एक जैसे नहीं हैं।');
      return;
    }

    if (aadhaarNumber.replace(/\s+/g, '').length < 12) {
      showRegistrationError('आधार नंबर १२ अंकों का होना चाहिए।');
      return;
    }

    setIsSubmitting(true);

    try {
      const skillsArray = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name,
        username: username.trim(),
        email: email.trim(),
        role,
        age: Number(age) || 28,
        phone,
        aadhaarNumber,
        address,
        city,
        pincode,
        // GPS is optional. Omit incomplete location data so the server saves
        // the account and lets the user add their location later.
        ...(locationCaptured && registrationCapturedAt && registrationAccuracy
          ? {
              lat: registrationCoords.lat,
              lng: registrationCoords.lng,
              accuracy: registrationAccuracy,
              capturedAt: registrationCapturedAt,
            }
          : {}),
        profilePic:
          profilePic ||
          (role === 'worker'
            ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
        idProofDocument,
        idProofType,
        backgroundCert,
        occupation,
        skills: skillsArray.length > 0 ? skillsArray : ['Skilled Workmanship'],
        ratePerHour: Number(ratePerHour) || 300,
        ratePerMonth: Number(ratePerMonth) || 25000,
        rateUnit: 'hour',
        experienceYears: Number(experienceYears) || 5,
        bio:
          bio ||
          `Government verified ${occupation} on Karmyogi marketplace with high client satisfaction.`,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.requiresEmailVerification) {
        setPendingVerification({ email: data.email, username: data.username || username.trim() });
        setVerificationCode('');
        setErrorMessage('');
      } else {
        const message = String(data.error || '');
        showRegistrationError(
          message.includes('already registered')
            ? 'यह उपयोगकर्ता नाम या ईमेल पहले से पंजीकृत है।'
            : message.includes('verification') || message.includes('SMTP')
              ? 'ईमेल सत्यापन सेवा उपलब्ध नहीं है। कृपया कुछ समय बाद पुनः प्रयास करें।'
              : 'पंजीकरण पूरा नहीं हो सका। कृपया विवरण जाँचकर पुनः प्रयास करें।'
        );
      }
    } catch {
      showRegistrationError('नेटवर्क त्रुटि हुई। कृपया अपना कनेक्शन जाँचकर पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#F9F7F2] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header with Encryption & Trust Assurance */}
        <div className="bg-white p-6 border-b border-[#E5E1D8] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF2EA] border border-[#D2E0D0] text-[#5C6E58] uppercase tracking-wide">
                Secure Registration Portal
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#5C6E58] font-bold bg-[#EBF2EA] px-2 py-0.5 rounded-full border border-[#D2E0D0]">
                <Lock className="w-3 h-3" />
                <span>256-Bit E2EE Encrypted</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold font-display text-[#2D2926] mt-1">Join KARMYOGI Platform</h2>
            <p className="text-xs text-[#8C867E]">
              Bharat's trusted marketplace for certified trade professionals and seekers.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-[#2D2926] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <p className="inline-flex rounded-full bg-[#EBF2EA] border border-[#D2E0D0] px-3 py-1 text-xs font-bold text-[#5C6E58]">
            Registering as: {role === 'worker' ? 'Worker / Artisan' : 'Hire a Worker'}
          </p>
        </div>

        {/* Registration Form */}
        <form ref={registrationFormRef} noValidate onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto pr-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Personal Identity Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. Verified Identity & Contact (Mandatory)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Username *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="username"
                  placeholder="e.g. rameshwar01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Email address *</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Confirm password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Age (Years) *</label>
                <input
                  type="number"
                  required
                  min="18"
                  max="75"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98712 34501"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">
                  12-Digit Aadhaar Card Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="9876 5432 1098"
                    value={aadhaarNumber}
                    onChange={(e) => handleAadhaarFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E] font-mono"
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] text-[#5C6E58] flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>UIDAI Masked</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Street Address / Shop Location</label>
                <input
                  type="text"
                  placeholder="e.g. Shop 14, Timber Market, Sector 18"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] focus:border-[#8B5E3C] text-sm text-[#2D2926]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[#E5E1D8]">
                <label className="block text-xs font-bold text-[#423E3B] mb-2">Profile photo *</label>
                <div className="flex items-center gap-3">
                  {profilePic ? <img src={profilePic} alt="Profile preview" className="w-12 h-12 rounded-xl object-cover border border-[#E5E1D8]" /> : <div className="w-12 h-12 rounded-xl bg-[#F1EDE4] text-[#8B5E3C] flex items-center justify-center"><Camera className="w-5 h-5" /></div>}
                  <label className="px-3 py-2 rounded-lg bg-[#F1EDE4] border border-[#E5E1D8] hover:border-[#8B5E3C] text-xs font-bold text-[#423E3B] cursor-pointer">
                    Upload photo<input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfilePhoto(e.target.files?.[0])} />
                  </label>
                </div>
                <p className="mt-2 text-[10px] text-[#8C867E]">JPG, PNG, or WebP up to 3 MB.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#EBF2EA] border border-[#D2E0D0]">
                <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-[#5C6E58]">Current location <span className="font-normal">(optional)</span></p><p className="mt-1 text-[10px] text-[#8C867E]">{locationCaptured ? `Captured: ${registrationCoords.lat.toFixed(5)}, ${registrationCoords.lng.toFixed(5)}${registrationAccuracy ? ` (±${Math.round(registrationAccuracy)}m)` : ''}` : 'You can continue now and update location later for nearby matching.'}</p></div><MapPin className="w-4 h-4 text-[#5C6E58] shrink-0" /></div>
                <button type="button" onClick={captureCurrentLocation} disabled={isCapturingLocation} className="mt-3 px-3 py-2 rounded-lg bg-[#5C6E58] hover:bg-[#4A5947] disabled:opacity-50 text-white text-xs font-bold">{isCapturingLocation ? 'Capturing…' : locationCaptured ? 'Refresh location' : 'Use my current location'}</button>
                {locationError && <p className="mt-2 text-[10px] text-red-600">{locationError}</p>}
              </div>
            </div>
          </div>

          {/* Document Verification & Certifications */}
          <div className="space-y-3 pt-3 border-t border-[#E5E1D8]">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>2. Trust & Document Verification (Government ID & Certificates)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-[#E5E1D8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D2926]">Government ID Proof</span>
                  <span className="text-[10px] text-[#5C6E58] font-bold bg-[#EBF2EA] px-1.5 py-0.5 rounded border border-[#D2E0D0]">
                    Auto-Verified
                  </span>
                </div>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] text-xs text-[#2D2926]"
                >
                  <option value="Aadhaar Card">Aadhaar Card (UIDAI Linked)</option>
                  <option value="Voter ID Card">Voter ID Card (ECI)</option>
                  <option value="Driving License">Commercial Driving License</option>
                  <option value="Trade Guild Pass">Certified Guild / Contractor License</option>
                </select>
                <label className="flex items-center gap-2 text-xs text-[#423E3B] bg-[#F9F7F2] p-2 rounded-lg border border-dashed border-[#E5E1D8] hover:border-[#8B5E3C] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" /><span className="truncate">{idProofDocument}</span>
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleDocumentUpload('id', e.target.files?.[0])} />
                </label>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E5E1D8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D2926]">Background Verification / Certificate</span>
                  <span className="text-[10px] text-[#8B5E3C] font-bold bg-[#F5EBE1] px-1.5 py-0.5 rounded border border-[#E8D7C3]">
                    Compliance
                  </span>
                </div>
                <p className="text-[11px] text-[#8C867E]">
                  Police Clearance Certificate, ITI Diploma, or Resident Society Verification.
                </p>
                <label className="flex items-center gap-2 text-xs text-[#423E3B] bg-[#F9F7F2] p-2 rounded-lg border border-dashed border-[#E5E1D8] hover:border-[#8B5E3C] cursor-pointer">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5C6E58] shrink-0" /><span className="truncate">{backgroundCert}</span>
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleDocumentUpload('background', e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>

          {/* Worker Specific Portfolio & Pricing Fields */}
          {role === 'worker' && (
            <div className="space-y-3 pt-3 border-t border-[#E5E1D8]">
              <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Worker Portfolio, Trade Occupation & Pricing (₹/Hour & ₹/Month)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Primary Occupation *</label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value as Occupation)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] focus:border-[#8B5E3C] font-medium"
                  >
                    {OCCUPATIONS_LIST.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Hourly Rate (₹ / Hour) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-[#8C867E] font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="50"
                      max="10000"
                      value={ratePerHour}
                      onChange={(e) => setRatePerHour(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Monthly Retainer (₹ / Month)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-[#8C867E] font-bold">₹</span>
                    <input
                      type="number"
                      min="1000"
                      value={ratePerMonth}
                      onChange={(e) => setRatePerMonth(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Experience (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#423E3B] mb-1">Skills & Specializations (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Modular Kitchens, Teak Wood, CNC Carving"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423E3B] mb-1">Short Professional Bio & Portfolio Summary</label>
                <textarea
                  rows={2}
                  placeholder="Tell clients about your master craftsmanship, previous projects, and reliability..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E5E1D8] text-sm text-[#2D2926] placeholder-[#8C867E]"
                />
              </div>
            </div>
          )}

          {/* Privacy & E2EE badge guarantee */}
          <div className="p-3 rounded-xl bg-[#EBF2EA] border border-[#D2E0D0] text-[#423E3B] text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#5C6E58] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-[#5C6E58]">Data Privacy & Security Guarantee:</strong> All personal ID documents, Aadhaar details, and live location coordinates are encrypted with 256-bit protocol and processed in strict compliance with digital privacy standards. Unlocked only with authorized client booking.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F1EDE4] hover:bg-[#E5E1D8] text-xs font-bold text-[#2D2926] transition-colors cursor-pointer border border-[#E5E1D8]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-register-btn"
              className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724D31] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying & Registering...' : 'Complete Verified Registration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
