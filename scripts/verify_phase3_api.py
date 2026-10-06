import json
import time
import uuid
import urllib.error
import urllib.request
import http.cookiejar


BASE_URL = 'http://localhost:5000/api'


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def request(self, path, method='GET', payload=None, headers=None, parse_json=True):
        req_headers = dict(headers or {})

        if payload is None:
            body = None
        elif isinstance(payload, (bytes, bytearray)):
            body = payload
        else:
            body = json.dumps(payload).encode('utf-8')
            req_headers.setdefault('Content-Type', 'application/json')

        req = urllib.request.Request(f'{BASE_URL}{path}', data=body, headers=req_headers, method=method)

        try:
            with self.opener.open(req) as response:
                raw = response.read()
                if parse_json:
                    text = raw.decode('utf-8') if raw else ''
                    return response.status, json.loads(text) if text else {}, response.headers
                return response.status, raw, response.headers
        except urllib.error.HTTPError as exc:
            raw = exc.read()
            if parse_json:
                text = raw.decode('utf-8') if raw else ''
                return exc.code, json.loads(text) if text else {'message': str(exc)}, exc.headers
            return exc.code, raw, exc.headers


def print_step(title, status, data):
    print(f'\n{title}')
    print(f'Status: {status}')
    if isinstance(data, (bytes, bytearray)):
        print(f'Bytes: {len(data)}')
    else:
        print(json.dumps(data, indent=2))


def assert_status(status, expected, label):
    if status != expected:
        raise AssertionError(f'{label} failed. Expected {expected}, got {status}.')


def encode_multipart(file_name, content, content_type='application/pdf'):
    boundary = f'----studenthub-{uuid.uuid4().hex}'
    parts = [
        f'--{boundary}\r\n'.encode('utf-8'),
        f'Content-Disposition: form-data; name="file"; filename="{file_name}"\r\n'.encode('utf-8'),
        f'Content-Type: {content_type}\r\n\r\n'.encode('utf-8'),
        content,
        b'\r\n',
        f'--{boundary}--\r\n'.encode('utf-8'),
    ]
    body = b''.join(parts)
    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    return body, headers


def upload_file(client, file_name, content):
    body, headers = encode_multipart(file_name, content)
    status, data, _ = client.request('/files', method='POST', payload=body, headers=headers)
    print_step(f'Upload file {file_name}', status, data)
    assert_status(status, 201, f'Upload {file_name}')
    file_id = data.get('file', {}).get('id')
    if not file_id:
        raise AssertionError('File upload did not return file.id')
    return file_id


def run():
    ts = int(time.time())
    student_a_email = f'phase3a{ts}@example.com'
    student_b_email = f'phase3b{ts}@example.com'
    password = 'Password123'

    student_a = Client()
    student_b = Client()
    anon = Client()

    status, data, _ = student_a.request('/auth/register', 'POST', {
        'name': 'Phase3 Student A',
        'email': student_a_email,
        'password': password,
        'role': 'student',
    })
    print_step('Register Student A', status, data)
    assert_status(status, 201, 'Register Student A')

    status, data, _ = student_b.request('/auth/register', 'POST', {
        'name': 'Phase3 Student B',
        'email': student_b_email,
        'password': password,
        'role': 'student',
    })
    print_step('Register Student B', status, data)
    assert_status(status, 201, 'Register Student B')

    status, data, _ = anon.request('/projects', 'GET')
    print_step('Anonymous access to protected module', status, data)
    assert_status(status, 401, 'Anonymous protected route check')

    file_1 = upload_file(student_a, 'certificate-old.pdf', b'%PDF-1.4 old-cert-bytes')
    file_2 = upload_file(student_a, 'certificate-new.pdf', b'%PDF-1.4 new-cert-bytes')

    status, data, _ = student_a.request('/projects', 'POST', {
        'title': 'Campus Placement Portal',
        'description': 'Role-based full stack portal',
        'technologies': ['React', 'Node.js', 'MongoDB'],
        'role': 'Backend Developer',
        'projectType': 'academic',
        'startDate': '2025-01-10',
        'status': 'completed',
    })
    print_step('Create project', status, data)
    assert_status(status, 201, 'Create project')
    project_id = data.get('record', {}).get('_id')

    status, data, _ = student_a.request('/internships', 'POST', {
        'organization': 'Tech Corp',
        'role': 'Software Intern',
        'description': 'Worked on APIs',
        'internshipType': 'on-site',
        'startDate': '2025-03-01',
        'endDate': '2025-05-31',
        'status': 'completed',
    })
    print_step('Create internship', status, data)
    assert_status(status, 201, 'Create internship')
    internship_id = data.get('record', {}).get('_id')

    status, data, _ = student_a.request('/certificates', 'POST', {
        'title': 'Cloud Fundamentals',
        'issuingOrganization': 'Cloud Academy',
        'issueDate': '2025-02-20',
        'verificationStatus': 'verified',
        'file': file_1,
    })
    print_step('Create certificate with file', status, data)
    assert_status(status, 201, 'Create certificate')
    certificate_id = data.get('record', {}).get('_id')

    status, data, _ = student_a.request('/achievements', 'POST', {
        'title': 'Top Innovator Award',
        'description': 'Won annual innovation challenge',
        'category': 'technical',
        'date': '2025-04-14',
        'level': 'state',
    })
    print_step('Create achievement', status, data)
    assert_status(status, 201, 'Create achievement')
    achievement_id = data.get('record', {}).get('_id')

    status, data, _ = student_a.request('/competitions', 'POST', {
        'competitionName': 'HackSprint 2025',
        'organizer': 'City Tech Council',
        'participationDate': '2025-06-10',
        'level': 'national',
        'result': 'Finalist',
    })
    print_step('Create competition', status, data)
    assert_status(status, 201, 'Create competition')
    competition_id = data.get('record', {}).get('_id')

    status, data, _ = student_a.request('/activities', 'POST', {
        'activityType': 'sports',
        'activityName': 'Basketball',
        'eventName': 'Intercollege League',
        'date': '2025-07-12',
        'level': 'district',
        'result': 'Runner-up',
    })
    print_step('Create activity', status, data)
    assert_status(status, 201, 'Create activity')
    activity_id = data.get('record', {}).get('_id')

    status, data, _ = student_a.request(f'/certificates/{certificate_id}', 'PATCH', {
        'file': file_2,
        'verificationStatus': 'verified',
    })
    print_step('Replace certificate file', status, data)
    assert_status(status, 200, 'Patch certificate file replacement')

    status, _, _ = student_a.request(f'/files/{file_1}', 'GET', parse_json=False)
    print_step('Fetch old replaced file', status, {'note': 'Should be deleted after replacement'})
    assert_status(status, 404, 'Old replaced file should be deleted')

    status, file_bytes, headers = student_a.request(f'/files/{file_2}', 'GET', parse_json=False)
    print_step('Fetch active certificate file as owner', status, file_bytes)
    assert_status(status, 200, 'Owner should fetch active file')
    if not file_bytes:
        raise AssertionError('Downloaded file is empty.')
    content_type = headers.get('Content-Type', '')
    if 'application/pdf' not in content_type:
        raise AssertionError(f'Unexpected content type for file download: {content_type}')

    status, _, _ = student_b.request(f'/files/{file_2}', 'GET', parse_json=False)
    print_step('Ownership check: student B reading student A file', status, {'expected': 404})
    assert_status(status, 404, 'File ownership check')

    status, data, _ = student_b.request(f'/projects/{project_id}', 'GET')
    print_step('Ownership check: student B reading student A project', status, data)
    assert_status(status, 404, 'Project ownership GET check')

    status, data, _ = student_a.request('/projects/not-a-valid-id', 'GET')
    print_step('Malformed ID check for projects', status, data)
    assert_status(status, 400, 'Malformed ID validation')

    status, data, _ = student_a.request('/dashboard/summary', 'GET')
    print_step('Dashboard summary', status, data)
    assert_status(status, 200, 'Dashboard summary check')
    counts = data.get('counts', {})
    expected_nonzero = ['projects', 'internships', 'certificates', 'achievements', 'competitions', 'activities']
    for key in expected_nonzero:
        if counts.get(key, 0) < 1:
            raise AssertionError(f'Expected dashboard count {key} >= 1, got {counts.get(key)}')

    for path, record_id in [
        ('/projects', project_id),
        ('/internships', internship_id),
        ('/achievements', achievement_id),
        ('/competitions', competition_id),
        ('/activities', activity_id),
        ('/certificates', certificate_id),
    ]:
        status, data, _ = student_a.request(f'{path}/{record_id}', 'DELETE')
        print_step(f'Delete {path}', status, data)
        assert_status(status, 200, f'Delete {path}')

    status, data, _ = student_a.request(f'/files/{file_2}', 'GET', parse_json=False)
    print_step('Fetch file after certificate delete', status, {'expected': 404})
    assert_status(status, 404, 'File should be removed when owning record is deleted')

    print('\nAll Phase 3 API checks passed.')


if __name__ == '__main__':
    run()
