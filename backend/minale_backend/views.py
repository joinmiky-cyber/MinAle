from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        "message": "Welcome to the MinAle API",
        "admin_url": "/admin/",
        "api_root": "/api/",
        "status": "running"
    })
