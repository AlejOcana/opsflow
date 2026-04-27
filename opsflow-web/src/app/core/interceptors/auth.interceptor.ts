import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      console.log('[AuthInterceptor] Token found, adding Authorization header');
      console.log('[AuthInterceptor] Token preview:', token.substring(0, 20) + '...');
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.warn('[AuthInterceptor] No token found in localStorage');
      console.log('[AuthInterceptor] Request URL:', req.url);
    }
    
    return next.handle(req);
  }
}