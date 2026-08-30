// POST /api/common/upload — CommonController.upload() (S3 업로드 후 URL 반환, 로그인만 하면 가능)
// 이미지 파일 업로드(포스터/프로필 등 도메인 상관없이 공통 재사용).
// apiFetch를 안 씀 — 파일은 multipart/form-data로 보내야 해서(apiFetch는 항상 JSON).
export const uploadImage = async (file: File, folder: string = "posters"): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/common/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message ?? "이미지 업로드에 실패했습니다.");
  }
  return data.url as string;
};
