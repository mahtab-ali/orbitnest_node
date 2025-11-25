import type { HttpClient } from './client';
import type {
  AuthSession,
  AuthUser,
  SignUpCredentials,
  SignInCredentials,
  PasswordRecoveryOptions,
  PasswordResetOptions,
  UpdateUserOptions,
  ApiResult,
} from '../types';

export class AuthClient {
  private session: AuthSession | null = null;

  constructor(private client: HttpClient) {}

  private get basePath(): string {
    return `/api/projects/${this.client.getProjectSlug()}/auth`;
  }

  /**
   * Get the current session
   */
  getSession(): AuthSession | null {
    return this.session;
  }

  /**
   * Get the current user
   */
  getUser(): AuthUser | null {
    return this.session?.user || null;
  }

  /**
   * Sign up with email and password - Step 1: Request OTP
   * This sends an OTP to the user's email for verification
   */
  async signUp(credentials: SignUpCredentials): Promise<ApiResult<{ success: boolean; message: string; email: string; expires_in: number }>> {
    const result = await this.client.request<{ success: boolean; message: string; email: string; expires_in: number }>(`${this.basePath}/signup`, {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password,
        user_metadata: credentials.metadata,
      },
    });

    // Note: No session is returned in step 1, only OTP confirmation
    return result;
  }

  /**
   * Verify signup with OTP - Step 2: Complete registration
   * This verifies the OTP and creates the user account
   */
  async verifySignUp(options: { email: string; code: string }): Promise<ApiResult<AuthSession>> {
    const result = await this.client.request<AuthSession>(`${this.basePath}/verify-signup`, {
      method: 'POST',
      body: {
        email: options.email,
        code: options.code,
      },
    });

    if (result.data) {
      this.session = result.data;
    }

    return result;
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<ApiResult<AuthSession>> {
    const result = await this.client.request<AuthSession>(`${this.basePath}/signin`, {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password,
      },
    });

    if (result.data) {
      this.session = result.data;
    }

    return result;
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ApiResult<{ success: boolean }>> {
    if (!this.session) {
      return { data: { success: true }, error: null };
    }

    const result = await this.client.request<{ success: boolean }>(`${this.basePath}/signout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.session.access_token}`,
      },
    });

    this.session = null;
    return result;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<ApiResult<AuthSession>> {
    if (!this.session?.refresh_token) {
      return {
        data: null,
        error: { message: 'No refresh token available', code: 'NO_SESSION' },
      };
    }

    const result = await this.client.request<AuthSession>(`${this.basePath}/refresh`, {
      method: 'POST',
      body: { refresh_token: this.session.refresh_token },
    });

    if (result.data) {
      this.session = result.data;
    }

    return result;
  }

  /**
   * Send password recovery email
   */
  async resetPasswordForEmail(options: PasswordRecoveryOptions): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(`${this.basePath}/recover-password`, {
      method: 'POST',
      body: { email: options.email },
    });
  }

  /**
   * Reset password with token
   */
  async updatePassword(options: PasswordResetOptions): Promise<ApiResult<{ success: boolean }>> {
    return this.client.request<{ success: boolean }>(`${this.basePath}/reset-password`, {
      method: 'POST',
      body: {
        token: options.token,
        password: options.password,
      },
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResult<AuthUser>> {
    if (!this.session?.access_token) {
      return {
        data: null,
        error: { message: 'No active session', code: 'NO_SESSION' },
      };
    }

    return this.client.request<AuthUser>(`${this.basePath}/user`, {
      headers: {
        Authorization: `Bearer ${this.session.access_token}`,
      },
    });
  }

  /**
   * Update user profile
   */
  async updateUser(options: UpdateUserOptions): Promise<ApiResult<AuthUser>> {
    if (!this.session?.access_token) {
      return {
        data: null,
        error: { message: 'No active session', code: 'NO_SESSION' },
      };
    }

    return this.client.request<AuthUser>(`${this.basePath}/user`, {
      method: 'PUT',
      body: options,
      headers: {
        Authorization: `Bearer ${this.session.access_token}`,
      },
    });
  }

  /**
   * Delete current user account
   */
  async deleteUser(): Promise<ApiResult<{ success: boolean }>> {
    if (!this.session?.access_token) {
      return {
        data: null,
        error: { message: 'No active session', code: 'NO_SESSION' },
      };
    }

    const result = await this.client.request<{ success: boolean }>(`${this.basePath}/user`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.session.access_token}`,
      },
    });

    if (result.data) {
      this.session = null;
    }

    return result;
  }

  /**
   * Set session manually (e.g., from stored tokens)
   */
  setSession(session: AuthSession): void {
    this.session = session;
  }
}
