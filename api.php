<?php
/**
 * @license
 * KruAI Studio - API Backend (PHP Version)
 * รองรับการทำงานบน Hosting ทั่วไป
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// 1. ตั้งค่าฐานข้อมูล (คุณครูแก้ไขจุดนี้ให้ตรงกับ Hosting ของคุณครูได้เลยครับ)
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "worksheet_db";

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "เชื่อมต่อฐานข้อมูลล้มเหลว: " . $e->getMessage()]);
    exit;
}

// 2. ฟังก์ชันตรวจสอบ Token (รองรับทั้ง Apache และ IIS)
function getAuthUser($conn) {
    $authHeader = null;
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        }
    }
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if ($authHeader) {
        $token = str_replace('Bearer ', '', $authHeader);
        $stmt = $conn->prepare("SELECT * FROM users WHERE auth_token = ?");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

// 3. Routing (จัดการคำร้องขอต่างๆ)
$path = isset($_GET['path']) ? $_GET['path'] : '';
$data = json_decode(file_get_contents("php://input"), true);

switch ($path) {
    // --- ระบบยืนยันตัวตน ---
    case 'auth/login':
        $national_id = $data['national_id'];
        $password = $data['password'];
        $stmt = $conn->prepare("SELECT * FROM users WHERE national_id = ?");
        $stmt->execute([$national_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            if ($user['status'] !== 'approved') {
                echo json_encode(["error" => "บัญชีของคุณยังไม่ได้รับการอนุมัติ"]);
                exit;
            }
            $token = bin2hex(random_bytes(32));
            $stmt = $conn->prepare("UPDATE users SET auth_token = ? WHERE id = ?");
            $stmt->execute([$token, $user['id']]);
            unset($user['password']);
            echo json_encode(["token" => $token, "user" => $user]);
        } else {
            echo json_encode(["error" => "ID หรือ รหัสผ่านไม่ถูกต้อง"]);
        }
        break;

    case 'auth/register':
        $national_id = $data['national_id'];
        $full_name = $data['full_name'];
        $password = password_hash($data['password'], PASSWORD_BCRYPT);
        $school = $data['school'];
        $position = $data['position'];
        
        try {
            $stmt = $conn->prepare("INSERT INTO users (national_id, full_name, password, school, position, status) VALUES (?, ?, ?, ?, ?, 'pending')");
            $stmt->execute([$national_id, $full_name, $password, $school, $position]);
            echo json_encode(["message" => "สมัครสมาชิกสำเร็จ โปรรอการอนุมัติ"]);
        } catch(Exception $e) {
            echo json_encode(["error" => "ID นี้มีการใช้งานไปแล้ว"]);
        }
        break;

    // --- ระบบ AI (Gemini) ---
    case 'generate-exercise':
        $user = getAuthUser($conn);
        if (!$user) { http_response_code(401); exit; }
        
        $apiKey = !empty($user['api_key']) ? $user['api_key'] : ""; // ใส่ Key ของระบบเผื่อไว้ที่นี่ได้ครับ
        if (!$apiKey) {
            echo json_encode(["error" => "ไม่พบ API KEY ของคุณครู"]);
            exit;
        }

        $prompt = $data['prompt'];
        $system = $data['systemInstruction'];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
        $payload = [
            "contents" => [
                ["parts" => [["text" => $prompt]]]
            ],
            "generationConfig" => ["responseMimeType" => "application/json"],
            "systemInstruction" => ["parts" => [["text" => $system]]]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            echo json_encode(["error" => "AI ขัดข้อง: " . $err]);
        } else {
            $result = json_decode($response, true);
            if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                echo $result['candidates'][0]['content']['parts'][0]['text'];
            } else {
                echo json_encode(["error" => "การตอบสนองจาก AI ไม่ถูกต้อง"]);
            }
        }
        break;

    // --- ใบงาน ---
    case 'exercises':
        $user = getAuthUser($conn);
        if (!$user) { http_response_code(401); exit; }

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $stmt = $conn->prepare("SELECT * FROM exercises WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user['id']]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $stmt = $conn->prepare("INSERT INTO exercises (user_id, title, grade, subject, type, difficulty, content, indicator, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $user['id'], $data['title'], $data['grade'], $data['subject'], 
                $data['type'], $data['difficulty'], json_encode($data['content']), 
                $data['indicator'], $data['description']
            ]);
            echo json_encode(["message" => "บันทึกสำเร็จ"]);
        }
        break;

    case 'user/profile':
        $user = getAuthUser($conn);
        if (!$user) { http_response_code(401); exit; }
        
        $stmt = $conn->prepare("UPDATE users SET full_name = ?, school = ?, position = ?, api_key = ? WHERE id = ?");
        $stmt->execute([$data['full_name'], $data['school'], $data['position'], $data['api_key'], $user['id']]);
        echo json_encode(["message" => "อัปเดตสำเร็จ"]);
        break;

    default:
        echo json_encode(["status" => "ready", "engine" => "PHP 8.x"]);
        break;
}
