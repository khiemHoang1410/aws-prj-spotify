/**
 * File này xử lý các tác vụ liên quan đến User Authentication (AWS Amplify/Cognito)
 */

// Hàm giả lập lấy Token. Sau này ráp Amplify thật, nó sẽ tự động handle việc refresh token ở đây.
export const getAuthToken = async () => {
  try {
    // TODO: Khi có Amplify, thay bằng: 
    // const session = await Auth.currentSession();
    // return session.getIdToken().getJwtToken();

    // Hiện tại giả lập trả về token ảo
    return "mock_jwt_token_123456"; 
  } catch (error) {
    console.error("Không thể lấy token xác thực", error);
    return null;
  }
};

// Hàm tạo Header chuẩn có đính kèm Bearer Token
export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

// ==========================================
// API FUNCTIONS (Giả lập chờ AWS Amplify)
// ==========================================

// Hàm xử lý Đăng nhập
export const login = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Giả lập check database
      if (email === "test@gmail.com" && password === "123456") {
        resolve({
          user_id: "USER_001",
          username: "Spotify Lover",
          email: email,
          avatar_url: "https://i.pravatar.cc/150?img=11"
        });
      } else {
        reject(new Error("Email hoặc mật khẩu không đúng! (Gợi ý: test@gmail.com / 123456)"));
      }
    }, 800); // Giả lập chờ 0.8s
  });
};

// Hàm xử lý Đăng ký
export const register = async (username, email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email.includes("@")) {
        reject(new Error("Email không hợp lệ!"));
        return;
      }
      // Giả lập đăng ký thành công và tự động đăng nhập luôn
      resolve({
        user_id: `USER_${Math.floor(Math.random() * 1000)}`,
        username: username,
        email: email,
        avatar_url: "https://i.pravatar.cc/150?img=12"
      });
    }, 800);
  });
};