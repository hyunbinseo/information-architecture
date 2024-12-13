# 개사봇

이 시각 주요 뉴스를 선택하거나, 뉴스를 선택해 개사를 요청해 보세요.

서울대학교 연합전공 정보문화학 정보구조 (2024-2) 프로젝트입니다.

> [!NOTE]  
> 과제전이 종료된 후에는 공개 호스팅을 제공하지 않습니다.

![개사봇 스크린샷](https://github.com/user-attachments/assets/0f7fabe8-a642-4e68-9921-0d4c93ec03a6)

## 실행 방법

[ChromaDB 설치](https://docs.trychroma.com/getting-started)

```shell
# 파이썬 필수
pip install chromadb
```

OpenAI API 키 입력

```shell
# .env 파일 생성
OPEN_AI_API_KEY=""
```

ChromaDB, SvelteKit 서버 실행

```shell
# 별도의 터미널에서 실행
node --run chroma
node --run dev
```
