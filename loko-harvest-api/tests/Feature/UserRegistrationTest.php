<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $driver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'System Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'phone' => '0700000000',
        ]);

        $this->driver = User::create([
            'name' => 'John Driver',
            'email' => 'driver@test.com',
            'password' => Hash::make('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700000001',
        ]);
    }

    public function test_user_can_register()
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alice Admin',
            'email' => 'alice@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0700000002',
            'role' => 'admin',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registration request submitted successfully. It is pending administrator approval.',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@test.com',
            'role' => 'admin',
            'status' => 'pending',
        ]);
    }

    public function test_pending_user_cannot_login()
    {
        $pendingUser = User::create([
            'name' => 'Pending Bob',
            'email' => 'bob@test.com',
            'password' => Hash::make('password'),
            'role' => 'sales_accounts',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@test.com',
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonFragment([
                'email' => ['Your account is pending administrator approval.']
            ]);
    }

    public function test_suspended_user_cannot_login()
    {
        $suspendedUser = User::create([
            'name' => 'Suspended Bob',
            'email' => 'bob@test.com',
            'password' => Hash::make('password'),
            'role' => 'sales_accounts',
            'status' => 'suspended',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@test.com',
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonFragment([
                'email' => ['Your account has been suspended.']
            ]);
    }

    public function test_rejected_user_cannot_login()
    {
        $rejectedUser = User::create([
            'name' => 'Rejected Bob',
            'email' => 'bob@test.com',
            'password' => Hash::make('password'),
            'role' => 'sales_accounts',
            'status' => 'rejected',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@test.com',
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonFragment([
                'email' => ['Your account registration has been rejected.']
            ]);
    }

    public function test_approved_user_can_login()
    {
        $activeUser = User::create([
            'name' => 'Active Bob',
            'email' => 'bob@test.com',
            'password' => Hash::make('password'),
            'role' => 'sales_accounts',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bob@test.com',
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ]);
    }

    public function test_admin_can_list_users()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'status',
                    ]
                ]
            ]);
    }

    public function test_admin_can_approve_reject_suspend_delete_users()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'testuser@test.com',
            'password' => Hash::make('password'),
            'role' => 'store_manager',
            'status' => 'pending',
        ]);

        // Approve
        $resApprove = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/users/{$user->id}/approve");
        $resApprove->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'active']);

        // Suspend
        $resSuspend = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/users/{$user->id}/suspend");
        $resSuspend->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'suspended']);

        // Reject
        $resReject = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/users/{$user->id}/reject");
        $resReject->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'rejected']);

        // Delete
        $resDelete = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$user->id}");
        $resDelete->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_non_admin_cannot_access_user_management()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'testuser@test.com',
            'password' => Hash::make('password'),
            'role' => 'store_manager',
            'status' => 'pending',
        ]);

        // Attempt list
        $this->actingAs($this->driver, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertStatus(403);

        // Attempt approve
        $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/admin/users/{$user->id}/approve")
            ->assertStatus(403);

        // Attempt reject
        $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/admin/users/{$user->id}/reject")
            ->assertStatus(403);

        // Attempt suspend
        $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/admin/users/{$user->id}/suspend")
            ->assertStatus(403);

        // Attempt delete
        $this->actingAs($this->driver, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$user->id}")
            ->assertStatus(403);
    }

    public function test_non_admin_roles_cannot_self_register()
    {
        $nonAdminRoles = ['store_manager', 'sales_accounts', 'driver', 'production_manager'];

        foreach ($nonAdminRoles as $role) {
            $response = $this->postJson('/api/v1/auth/register', [
                'name' => 'Alice ' . $role,
                'email' => $role . '@test.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'phone' => '0700000002',
                'role' => $role,
            ]);
            $response->assertStatus(422);
        }
    }

    public function test_authenticated_user_can_change_password()
    {
        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'password',
                'new_password' => 'newsecret123',
                'new_password_confirmation' => 'newsecret123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Attempt login with new password
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => $this->driver->email,
            'password' => 'newsecret123',
            'device_name' => 'test-device',
        ]);
        $loginRes->assertStatus(200);
    }

    public function test_change_password_requires_correct_current_password()
    {
        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson('/api/v1/auth/change-password', [
                'current_password' => 'wrongpassword',
                'new_password' => 'newsecret123',
                'new_password_confirmation' => 'newsecret123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }
}
