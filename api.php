<?php
/**
 * @license KruAI Studio - Standard API Core
 * ไฟล์พนักงานหลังบ้าน (Core Logic) 
 * คุณครูสามารถก๊อปปี้ไฟล์นี้ไปบันทึกทับได้ตลอดเวลาเมื่อมีการอัปเดตระบบ
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// --- 1. เชื่อมต่อฐานข้อมูล (ดึงค่าจาก config.php) ---
if (!file_exists('config.php')) {
    echo json_encode(["error" => "ไม่พบไฟล์ config.php กรุณาสร้างไฟล์เพื่อตั้งค่าฐานข้อมูลก่อน"]);
    exit;
}
require_once 'config.php';

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "เชื่อมต่อฐานข้อมูลล้มเหลว: " . $e->getMessage()]);
    exit;
}

// --- 2. ฟังก์ชันตรวจสอบสิทธิ์ (Identity Check) ---
function getAuthUser($conn) {
    $authHeader = null;
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) { $authHeader = $headers['Authorization']; }
    }
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) { $authHeader = $_SERVER['HTTP_AUTHORIZATION']; }

    if ($authHeader) {
        $token = str_replace('Bearer ', '', $authHeader);
        $stmt = $conn->prepare("SELECT * FROM users WHERE auth_token = ?");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

// --- 3. จัดการ Routing (ระบบสั่งการ) ---
$path = isset($_GET['path']) ? $_GET['path'] : '';
$data = json_decode(file_get_contents("php://input"), true);

switch ($path) {
    case 'auth/login':
        $stmt = $conn->prepare("SELECT * FROM users WHERE national_id = ?");
        $stmt->execute([$data['national_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && password_verify($data['password'], $user['password'])) {
            if ($user['status'] !== 'approved') { echo json_encode(["error" => "บัญชีรอการอนุมัติ"]); exit; }
            $token = bin2hex(random_bytes(32));
            $stmt = $conn->prepare("UPDATE users SET auth_token = ? WHERE id = ?");
            $stmt->execute([$token, $user['id']]);
            unset($user['password']);
            echo json_encode(["token" => $token, "user" => $user]);
        } else { echo json_encode(["error" => "ID หรือ รหัสผ่านไม่ถูกต้อง"]); }
        break;

    case 'generate-exercise':
        $user = getAuthUser($conn);
        if (!$user) { http_response_code(401); exit; }
        $apiKey = $user['api_key'];
        
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
        $payload = [
            "contents" => [["parts" => [["text" => $data['prompt']]]]],
            "generationConfig" => ["responseMimeType" => "application/json"],
            "systemInstruction" => ["parts" => [["text" => $data['systemInstruction']]]]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            $err = json_decode($response, true);
            echo json_encode(["error" => "Google AI Error: " . ($err['error']['message'] ?? 'Unknown error')]);
        } else {
            $res = json_decode($response, true);
            echo $res['candidates'][0]['content']['parts'][0]['text'] ?? json_encode(["error" => "AI No Response"]);
        }
        break;

    case 'exercises':
        $user = getAuthUser($conn);
        if (!$user) { http_response_code(401); exit; }
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $stmt = $conn->prepare("SELECT * FROM exercises WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user['id']]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $stmt = $conn->prepare("INSERT INTO exercises (user_id, title, grade, subject, type, difficulty, content, indicator, description) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$user['id'], $data['title'], $data['grade'], $data['subject'], $data['type'], $data['difficulty'], json_encode($data['content']), $data['indicator'], $data['description']]);
            echo json_encode(["message" => "บันทึกใบงานเรียบร้อย"]);
        }
        break;

    case 'user/profile':
        $user = getAuthUser($conn);
        if (!$user) { http_response_code(401); exit; }
        $stmt = $conn->prepare("UPDATE users SET full_name=?, school=?, position=?, api_key=? WHERE id=?");
        $stmt->execute([$data['full_name'], $data['school'], $data['position'], $data['api_key'], $user['id']]);
        echo json_encode(["message" => "อัปเดตโปรไฟล์สำเร็จ"]);
        break;

    default:
        echo json_encode(["status" => "ready", "version" => "PHP-API-2.0"]);
        break;
}
