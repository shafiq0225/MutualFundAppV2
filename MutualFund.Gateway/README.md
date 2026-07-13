---
title: Mutual Fund Gateway
emoji: 🔀
colorFrom: gray
colorTo: blue
sdk: docker
app_port: 7860
---

# Mutual Fund Gateway

This is the API Gateway for the Mutual Fund App, containerized and configured for deployment on Hugging Face Spaces.

## How to Deploy on Hugging Face Spaces

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces).
2. Select **Docker** as the SDK.
3. Push the contents of this folder (containing the `Dockerfile`, `README.md`, and all project folders) to the space's repository.
4. Go to **Settings** of the Space and add the following **Variables** / **Secrets**:
   * **Variable**: `ASPNETCORE_ENVIRONMENT` -> `Production` (this tells the Gateway to load `ocelot.Production.json`).
   * **Secret**: `JwtSettings__SecretKey` -> Your JWT secret key (must match the key used in AuthAPI and other microservices).
   * **Variable**: `JwtSettings__Issuer` -> `AMFINAV.AuthAPI`
   * **Variable**: `JwtSettings__Audience` -> `AMFINAV.Apps`
