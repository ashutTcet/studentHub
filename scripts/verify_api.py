import json
import urllib.request
import urllib.error
import http.cookiejar


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def request(self, url, method='GET', payload=None):
        headers = {'Content-Type': 'application/json'}
        body = None if payload is None else json.dumps(payload).encode('utf-8')
        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with self.opener.open(request) as response:
                raw = response.read().decode('utf-8')
                return response.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode('utf-8')
            data = json.loads(raw) if raw else {'message': str(exc)}
            return exc.code, data


client = Client()

print('REGISTER STUDENT')
status, result = client.request(
    'http://localhost:5000/api/auth/register',
    'POST',
    {
        'name': 'Alice Student',
        'email': 'alice.student@example.com',
        'password': 'Password123',
        'role': 'student'
    }
)
print(status)
print(json.dumps(result, indent=2))

print('LOGIN STUDENT')
status, result = client.request(
    'http://localhost:5000/api/auth/login',
    'POST',
    {'email': 'alice.student@example.com', 'password': 'Password123'}
)
print(status)
print(json.dumps(result, indent=2))

print('GET CURRENT USER')
status, result = client.request('http://localhost:5000/api/auth/me')
print(status)
print(json.dumps(result, indent=2))

print('UPDATE PROFILE')
status, result = client.request(
    'http://localhost:5000/api/profile',
    'PUT',
    {
        'department': 'Computer Science',
        'course': 'B.Tech Computer Science',
        'academicYear': '2024-2025',
        'semester': 'Semester 6',
        'phone': '+91 9876543210',
        'bio': 'Software engineering student focused on web and product development.',
        'linkedinUrl': 'https://linkedin.com/in/alice',
        'githubUrl': 'https://github.com/alice',
        'portfolioUrl': 'https://example.com/alice'
    }
)
print(status)
print(json.dumps(result, indent=2))

print('LOGOUT')
status, result = client.request('http://localhost:5000/api/auth/logout', 'POST', {})
print(status)
print(json.dumps(result, indent=2))

print('PROFILE WITHOUT SESSION')
status, result = client.request('http://localhost:5000/api/profile')
print(status)
print(json.dumps(result, indent=2))

print('INVALID REGISTRATION INPUT')
status, result = client.request(
    'http://localhost:5000/api/auth/register',
    'POST',
    {'name': 'Bad', 'email': 'not-an-email', 'password': 'short'}
)
print(status)
print(json.dumps(result, indent=2))

print('REGISTER ADMIN')
admin_client = Client()
status, result = admin_client.request(
    'http://localhost:5000/api/auth/register',
    'POST',
    {
        'name': 'Admin User',
        'email': 'admin.studenthub@example.com',
        'password': 'AdminPassword123',
        'role': 'admin',
        'adminSecret': 'studenthub-admin-secret'
    }
)
print(status)
print(json.dumps(result, indent=2))

print('ADMIN ROLE CHECK')
status, result = admin_client.request('http://localhost:5000/api/admin/health')
print(status)
print(json.dumps(result, indent=2))
