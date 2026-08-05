// ============================================================
// POST /api/common/upload
// 백엔드: CommonController.java → upload()  (S3에 업로드하고 URL을 돌려줌, 로그인만 하면 누구나 가능)
// 기능: 이미지 파일 업로드 (포스터든 프로필 사진이든 도메인 상관없이 공통으로 재사용)
//
// ⚠️ 다른 API들과 다르게 apiFetch를 안 씀 — 이유: JSON이 아니라 파일(이미지)을 보내야 해서
//    Content-Type: multipart/form-data 로 FormData를 실어 보내야 함
//    (apiFetch는 항상 JSON.stringify + application/json 헤더로 보내기 때문에 못 씀)
//
// 사용 예시 (<input type="file"> 의 onChange 핸들러 안에서):
//   import { uploadImage } from "@/lib/api/common";
//
//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     try {
//       const url = await uploadImage(file);           // 포스터용 (기본값)
//       // const url = await uploadImage(file, "profiles"); // 다른 용도면 folder만 바꿔서 재사용
//       setForm(f => ({ ...f, posterUrl: url }));       // 그대로 다른 API 호출 시 posterUrl로 사용
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };
//   <input type="file" accept="image/*" onChange={handleFileChange} />
//
// 요청: JSON이 아니라 multipart/form-data — key는 "file"(파일)과 "folder"(S3 폴더명, 백엔드 @RequestParam과 이름 일치)
// 응답 JSON:
//   성공: { "success": true, "url": "https://.../posters/xxxx.jpg" }
//   실패: { "message": "...", "code": "...", ... } (로그인 안 했으면 401, 업로드 실패면 500)
// ============================================================
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
