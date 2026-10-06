import json
import time
import urllib.error
import urllib.request
import http.cookiejar


BASE_URL = 'http://localhost:5000/api'


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def request(self, path, method='GET', payload=None):
        headers = {'Content-Type': 'application/json'}
        body = None if payload is None else json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(f'{BASE_URL}{path}', data=body, headers=headers, method=method)

        try:
            with self.opener.open(req) as response:
                raw = response.read().decode('utf-8')
                return response.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode('utf-8')
            return exc.code, json.loads(raw) if raw else {'message': str(exc)}


def print_step(title, status, data):
    print(f'\n{title}')
    print(f'Status: {status}')
    print(json.dumps(data, indent=2))


def assert_status(status, expected, label):
    if status != expected:
        raise AssertionError(f'{label} failed. Expected {expected}, got {status}.')


def run():
    ts = int(time.time())
    student_a_email = f'studentA{ts}@example.com'
    student_b_email = f'studentB{ts}@example.com'
    password = 'Password123'

    student_a = Client()
    student_b = Client()

    # Register Student A
    status, data = student_a.request('/auth/register', 'POST', {
        'name': 'Student A',
        'email': student_a_email,
        'password': password,
        'role': 'student',
    })
    print_step('Register Student A', status, data)
    assert_status(status, 201, 'Register Student A')

    # Register Student B
    status, data = student_b.request('/auth/register', 'POST', {
        'name': 'Student B',
        'email': student_b_email,
        'password': password,
        'role': 'student',
    })
    print_step('Register Student B', status, data)
    assert_status(status, 201, 'Register Student B')

    # Student A profile update
    status, data = student_a.request('/profile', 'PUT', {
        'name': 'Student A Updated',
        'email': student_a_email,
        'rollNumber': 'RA-1001',
        'enrollmentNumber': 'ENR-1001',
        'department': 'Computer Science',
        'course': 'B.Tech CSE',
        'academicYear': '2025-2026',
        'semester': '5',
        'phone': '+91 9876543210',
        'bio': 'Focused on backend engineering',
        'githubUrl': 'https://github.com/student-a',
    })
    print_step('Update Student A Profile', status, data)
    assert_status(status, 200, 'Update profile')

    # Student A create academic record
    status, data = student_a.request('/academic-records', 'POST', {
        'academicYear': '2025-2026',
        'semester': 5,
        'sgpa': 8.35,
        'cgpa': 8.11,
        'percentage': 81.2,
        'remarks': 'Consistent progress',
    })
    print_step('Create Academic Record (Student A)', status, data)
    assert_status(status, 201, 'Create academic record')

    record_id = data.get('record', {}).get('_id')
    if not record_id:
        raise AssertionError('Record ID not returned from create endpoint.')

    # Student A list (persistence check after create)
    status, data = student_a.request('/academic-records', 'GET')
    print_step('List Academic Records (Student A)', status, data)
    assert_status(status, 200, 'List academic records')
    if len(data.get('records', [])) == 0:
        raise AssertionError('Expected at least one academic record for Student A.')

    # Student A update record
    status, data = student_a.request(f'/academic-records/{record_id}', 'PUT', {
        'academicYear': '2025-2026',
        'semester': 5,
        'sgpa': 8.92,
        'cgpa': 8.4,
        'percentage': 84.7,
        'remarks': 'Updated SGPA after re-evaluation',
    })
    print_step('Update Academic Record (Student A)', status, data)
    assert_status(status, 200, 'Update academic record')

    # Student A get by id (verify update persisted)
    status, data = student_a.request(f'/academic-records/{record_id}', 'GET')
    print_step('Get Academic Record By ID (Student A)', status, data)
    assert_status(status, 200, 'Get academic record by id')
    if data.get('record', {}).get('sgpa') != 8.92:
        raise AssertionError('SGPA did not persist after update.')

    # Ownership check: Student B cannot read Student A's record
    status, data = student_b.request(f'/academic-records/{record_id}', 'GET')
    print_step('Ownership Test: Student B GET Student A Record', status, data)
    assert_status(status, 404, 'Ownership GET denial')

    # Ownership check: Student B cannot update Student A's record
    status, data = student_b.request(f'/academic-records/{record_id}', 'PUT', {
        'academicYear': '2025-2026',
        'semester': 5,
        'sgpa': 1.0,
        'cgpa': 1.0,
        'percentage': 10,
        'remarks': 'Malicious update attempt',
    })
    print_step('Ownership Test: Student B PUT Student A Record', status, data)
    assert_status(status, 404, 'Ownership PUT denial')

    # Ownership check: Student B cannot delete Student A's record
    status, data = student_b.request(f'/academic-records/{record_id}', 'DELETE')
    print_step('Ownership Test: Student B DELETE Student A Record', status, data)
    assert_status(status, 404, 'Ownership DELETE denial')

    # Invalid value check
    status, data = student_a.request('/academic-records', 'POST', {
        'academicYear': '2025-2026',
        'semester': 6,
        'sgpa': -1,
    })
    print_step('Invalid Value Test (Negative SGPA)', status, data)
    assert_status(status, 400, 'Negative SGPA validation')

    # Delete record and verify empty state for Student A list afterwards
    status, data = student_a.request(f'/academic-records/{record_id}', 'DELETE')
    print_step('Delete Academic Record (Student A)', status, data)
    assert_status(status, 200, 'Delete academic record')

    status, data = student_a.request('/academic-records', 'GET')
    print_step('List Academic Records after Delete (Student A)', status, data)
    assert_status(status, 200, 'List after delete')
    if any(rec.get('_id') == record_id for rec in data.get('records', [])):
        raise AssertionError('Deleted record still present after deletion.')

    print('\nAll Phase 2 API checks passed.')


if __name__ == '__main__':
    run()
