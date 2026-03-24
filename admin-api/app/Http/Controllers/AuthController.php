<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * AuthControllerの新しいインスタンスを作成
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:admin', ['except' => ['login', 'register']]);
    }

    /**
     * 管理者ログイン
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string|min:8',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $credentials = $request->only('email', 'password');

            // 管理者が存在し有効であるか確認
            $admin = Admin::where('email', $credentials['email'])->first();
            
            if (!$admin) {
                return $this->errorResponse('Invalid credentials', null, 401);
            }

            if (!$admin->is_active) {
                return $this->errorResponse('Account is deactivated', null, 403);
            }

            // 認証情報を検証し管理者トークンを作成
            if (!$token = auth('admin')->attempt($credentials)) {
                return $this->errorResponse('Invalid credentials', null, 401);
            }

            // 最終ログイン日時を更新
            $admin->updateLastLogin();

            return $this->respondWithToken($token, $admin);

        } catch (JWTException $e) {
            \Log::error('JWT Login Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return $this->errorResponse('Could not create token', $e->getMessage(), 500);
        } catch (\Exception $e) {
            \Log::error('Login Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return $this->errorResponse('Login failed', $e->getMessage(), 500);
        }
    }

    /**
     * 新しい管理者を登録（スーパー管理者のみ実行可能）
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        try {
            // 認証された管理者がスーパー管理者かチェック
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || !$currentAdmin->isSuperAdmin()) {
                return $this->errorResponse('Unauthorized to create admin accounts', null, 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:admins',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|string|in:super_admin,admin,manager,editor',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $admin = Admin::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'is_active' => true,
            ]);

            return $this->successResponse('Admin created successfully', [
                'admin' => $admin->only(['id', 'name', 'email', 'role', 'is_active', 'created_at'])
            ], 201);

        } catch (\Exception $e) {
            return $this->errorResponse('Registration failed', $e->getMessage(), 500);
        }
    }

    /**
     * 認証済み管理者の情報を取得
     *
     * @return JsonResponse
     */
    public function me(): JsonResponse
    {
        try {
            $admin = auth('admin')->user();
            
            if (!$admin) {
                return $this->errorResponse('Unauthorized', null, 401);
            }

            return $this->successResponse('Admin profile retrieved', [
                'admin' => $admin->only(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at'])
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get profile', $e->getMessage(), 500);
        }
    }

    /**
     * 管理者をログアウト（トークンを無効化）
     *
     * @return JsonResponse
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return $this->successResponse('Successfully logged out', null);

        } catch (JWTException $e) {
            return $this->errorResponse('Failed to logout, please try again', null, 500);
        }
    }

    /**
     * トークンをリフレッシュ
     *
     * @return JsonResponse
     */
    public function refresh(): JsonResponse
    {
        try {
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
            $admin = auth('admin')->user();

            return $this->respondWithToken($newToken, $admin);

        } catch (JWTException $e) {
            return $this->errorResponse('Token cannot be refreshed', null, 401);
        }
    }

    /**
     * パスワードを変更
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $admin = auth('admin')->user();

            if (!Hash::check($request->current_password, $admin->password)) {
                return $this->errorResponse('Current password is incorrect', null, 400);
            }

            $admin->update([
                'password' => Hash::make($request->new_password)
            ]);

            return $this->successResponse('Password changed successfully', null);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to change password', $e->getMessage(), 500);
        }
    }

    /**
     * プロフィールを更新
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $admin = auth('admin')->user();

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:admins,email,' . $admin->id,
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $admin->update($request->only(['name', 'email']));

            return $this->successResponse('Profile updated successfully', [
                'admin' => $admin->only(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'updated_at'])
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update profile', $e->getMessage(), 500);
        }
    }

    /**
     * 全管理者を取得（スーパー管理者のみ実行可能）
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getAdmins(Request $request): JsonResponse
    {
        try {
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || !$currentAdmin->isSuperAdmin()) {
                return $this->errorResponse('Unauthorized to view admin accounts', null, 403);
            }

            $query = Admin::query();

            // フィルターを適用
            if ($request->has('role')) {
                $query->byRole($request->role);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $admins = $query->orderBy('created_at', 'desc')
                          ->paginate($request->get('per_page', 15));

            return $this->successResponse('Admins retrieved successfully', [
                'admins' => $admins->items(),
                'pagination' => [
                    'current_page' => $admins->currentPage(),
                    'last_page' => $admins->lastPage(),
                    'per_page' => $admins->perPage(),
                    'total' => $admins->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve admins', $e->getMessage(), 500);
        }
    }

    /**
     * 管理者ステータスを更新（スーパー管理者のみ実行可能）
     *
     * @param Request $request
     * @param int $adminId
     * @return JsonResponse
     */
    public function updateAdminStatus(Request $request, int $adminId): JsonResponse
    {
        try {
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || !$currentAdmin->isSuperAdmin()) {
                return $this->errorResponse('Unauthorized to update admin accounts', null, 403);
            }

            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $admin = Admin::findOrFail($adminId);

            // 自分自身の無効化を防止
            if ($admin->id === $currentAdmin->id) {
                return $this->errorResponse('Cannot deactivate your own account', null, 400);
            }

            $admin->update(['is_active' => $request->is_active]);

            return $this->successResponse('Admin status updated successfully', [
                'admin' => $admin->only(['id', 'name', 'email', 'role', 'is_active', 'updated_at'])
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update admin status', $e->getMessage(), 500);
        }
    }

    /**
     * トークン配列構造を取得
     *
     * @param string $token
     * @param Admin $admin
     * @return JsonResponse
     */
    protected function respondWithToken(string $token, Admin $admin): JsonResponse
    {
        return $this->successResponse('Login successful', [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'admin' => $admin->only(['id', 'name', 'email', 'role', 'is_active', 'last_login_at'])
        ]);
    }

    /**
     * 成功レスポンスを返す
     *
     * @param string $message
     * @param mixed $data
     * @param int $statusCode
     * @return JsonResponse
     */
    private function successResponse(string $message, $data = null, int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * エラーレスポンスを返す
     *
     * @param string $message
     * @param mixed $errors
     * @param int $statusCode
     * @return JsonResponse
     */
    private function errorResponse(string $message, $errors = null, int $statusCode = 400): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }
}