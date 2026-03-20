/**
 * File này xử lý các tác vụ liên quan đến User Authentication (AWS Amplify/Cognito)
 */

const TOKEN_KEY = "spotify_mock_auth";
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // Mô phỏng 15 phút (tính bằng milliseconds)

// ==========================================
// 1. CÁC HÀM QUẢN LÝ TOKEN (Chuẩn bị cho Amplify)
// ==========================================

// Hàm thay thế AWS Amplify: Auth.fetchAuthSession()
export const fetchAuthSession = async () => {
  const sessionStr = localStorage.getItem(TOKEN_KEY);
  if (!sessionStr) return null;

  let session = JSON.parse(sessionStr);

  // Kiểm tra xem accessToken hết hạn chưa
  if (Date.now() > session.expiresAt) {
    console.log("Token hết hạn 15 phút! Dùng RefreshToken để lấy AccessToken mới...");
    
    // Giả lập cấp lại Token mới
    session.accessToken = "mock_access_token_NEW_" + Date.now();
    session.expiresAt = Date.now() + ACCESS_TOKEN_EXPIRY;
    
    // Lưu ngược lại phiên bản mới nhất vào bộ nhớ
    localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  }
  return session;
};

// Hàm lấy Token gắn vào Header API
export const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session ? session.accessToken : null; 
  } catch (error) {
    console.error("Không thể lấy token xác thực", error);
    return null;
  }
};

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

// Hàm phục hồi User từ Token (Dùng khi F5 Reload trang)
export const getCurrentUser = async () => {
  const session = await fetchAuthSession();
  return session ? session.user : null;
};

// ==========================================
// 2. CÁC HÀM ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT
// ==========================================

export const login = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "test@gmail.com" && password === "123456") {
        const userData = {
          user_id: "USER_001",
          username: "Spotify Lover",
          email: email,
          avatar_url: "https://i.pravatar.cc/150?img=11"
        };
        
        // Lưu phiên đăng nhập xuống localStorage
        const sessionData = {
          user: userData,
          accessToken: "mock_access_token_" + Date.now(),
          refreshToken: "mock_refresh_token_xyz",
          expiresAt: Date.now() + ACCESS_TOKEN_EXPIRY
        };
        localStorage.setItem(TOKEN_KEY, JSON.stringify(sessionData));
        
        resolve(userData);
      } else {
        reject(new Error("Email hoặc mật khẩu không đúng! (Gợi ý: test@gmail.com / 123456)"));
      }
    }, 800);
  });
};

export const register = async (username, email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email.includes("@")) {
        reject(new Error("Email không hợp lệ!"));
        return;
      }
      
      const userData = {
        user_id: `USER_${Math.floor(Math.random() * 1000)}`,
        username: username,
        email: email,
        avatar_url: "https://i.pravatar.cc/150?img=12"
      };

      // Đăng ký xong tự động lưu session như đăng nhập
      const sessionData = {
        user: userData,
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_xyz",
        expiresAt: Date.now() + ACCESS_TOKEN_EXPIRY
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(sessionData));

      resolve(userData);
    }, 800);
  });
};

export const logoutUser = async () => {
  // Xóa sạch Token khi Đăng xuất
  localStorage.removeItem(TOKEN_KEY);
};