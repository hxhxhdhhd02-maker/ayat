import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, Profile } from './lib/firebase';

/**
 * Creates an admin/teacher account manually
 * Call this function from browser console: window.createAdminAccount()
 */
export async function createAdminAccount() {
    const phone = '01228495250';
    const password = 'y2081049';
    const email = `${phone}@platform.local`;

    try {
        console.log('🔧 Creating admin account...');
        console.log('📱 Phone:', phone);
        console.log('📧 Email:', email);

        // Check if profile already exists
        const existingUsers = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: [email] })
            }
        );

        if (existingUsers.ok) {
            const data = await existingUsers.json();
            if (data.users && data.users.length > 0) {
                console.log('✅ User already exists in Firebase Auth');
                const userId = data.users[0].localId;

                // Check and update profile
                const docRef = doc(db, 'profiles', userId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists() || docSnap.data().role !== 'teacher') {
                    const profileData: Profile = {
                        id: userId,
                        phone_number: phone,
                        full_name_arabic: 'د/ آيات نبيل',
                        grade: 'all',
                        role: 'teacher',
                        wallet_balance: 0,
                        created_at: new Date().toISOString()
                    };
                    await setDoc(docRef, profileData, { merge: true });
                    console.log('✅ Profile updated to teacher role');
                    alert('✅ تم تحديث حساب المشرف بنجاح!\n\nرقم الموبايل: ' + phone + '\nكلمة المرور: ' + password);
                } else {
                    console.log('✅ Admin profile already correct');
                    alert('✅ حساب المشرف موجود بالفعل وجاهز للاستخدام!\n\nرقم الموبايل: ' + phone + '\nكلمة المرور: ' + password);
                }
                return { success: true, message: 'Account exists and is ready' };
            }
        }

        // Create new user
        console.log('📝 Creating new admin user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profileData: Profile = {
            id: user.uid,
            phone_number: phone,
            full_name_arabic: 'د/ آيات نبيل',
            grade: 'all',
            role: 'teacher',
            wallet_balance: 0,
            created_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'profiles', user.uid), profileData);
        console.log('✅ Admin account created successfully!');
        alert('✅ تم إنشاء حساب المشرف بنجاح!\n\nرقم الموبايل: ' + phone + '\nكلمة المرور: ' + password + '\n\nيمكنك الآن تسجيل الدخول من /teacher-login');

        // Sign out after creation
        await auth.signOut();

        return { success: true, message: 'Account created successfully' };

    } catch (error: any) {
        console.error('❌ Error creating admin:', error);

        let errorMessage = 'حدث خطأ: ' + error.message;

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = '⚠️ الحساب موجود بالفعل. حاول تسجيل الدخول بدلاً من ذلك.\n\nرقم الموبايل: ' + phone;
        } else if (error.code === 'auth/weak-password') {
            errorMessage = '⚠️ كلمة المرور ضعيفة جداً';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '⚠️ البريد الإلكتروني غير صالح';
        }

        alert('❌ ' + errorMessage);
        return { success: false, error: errorMessage };
    }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
    (window as any).createAdminAccount = createAdminAccount;
}
