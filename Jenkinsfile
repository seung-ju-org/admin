pipeline {
  agent {
    kubernetes {
      yamlFile 'ci/jenkins-agent.yaml'
      defaultContainer 'node'
    }
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    IMAGE_REPOSITORY = 'ghcr.io/seung-ju/admin'
    HELM_VALUES_FILE = 'helm/admin/values.yaml'
    GIT_USER_NAME = 'Jenkins'
    GIT_USER_EMAIL = 'no-reply@jenkins.seung-ju.com'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        container('node') {
          sh '''
            corepack enable
            pnpm --version
            pnpm install --frozen-lockfile
          '''
        }
      }
    }

    stage('Verify') {
      steps {
        container('node') {
          sh '''
            pnpm -s tsc --noEmit
            pnpm -s lint
          '''
        }
      }
    }

    stage('Build & Push Image') {
      when {
        branch 'main'
      }
      steps {
        script {
          env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(8)}"
        }

        withCredentials([
          usernamePassword(credentialsId: 'ghcr-credentials', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS'),
          string(credentialsId: 'sentry-auth-token', variable: 'SENTRY_AUTH_TOKEN')
        ]) {
          container('kaniko') {
            sh '''
              mkdir -p /kaniko/.docker
              AUTH=$(printf "%s:%s" "$REG_USER" "$REG_PASS" | base64 | tr -d '\\n')
              cat > /kaniko/.docker/config.json <<EOF
              {
                "auths": {
                  "https://ghcr.io": {
                    "auth": "${AUTH}"
                  }
                }
              }
              EOF

              /kaniko/executor \
                --context "${WORKSPACE}" \
                --dockerfile "${WORKSPACE}/Dockerfile" \
                --destination "${IMAGE_REPOSITORY}:${IMAGE_TAG}" \
                --cache=true \
                --build-arg SENTRY_AUTH_TOKEN="${SENTRY_AUTH_TOKEN}"
            '''
          }
        }

        writeFile file: '.image_tag', text: "${env.IMAGE_TAG}\n"
      }
    }

    stage('Update Helm Tag For ArgoCD') {
      when {
        branch 'main'
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'git-push-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          sh '''
            TAG=$(cat .image_tag)
            git config user.name "${GIT_USER_NAME}"
            git config user.email "${GIT_USER_EMAIL}"

            sed -i -E "s|(^[[:space:]]*tag:[[:space:]]*).*$|\\1${TAG}|" "${HELM_VALUES_FILE}"

            if git diff --quiet -- "${HELM_VALUES_FILE}"; then
              echo "No changes in ${HELM_VALUES_FILE}"
              exit 0
            fi

            git add "${HELM_VALUES_FILE}"
            git commit -m "ci: update admin image tag to ${TAG} [skip ci]"

            REMOTE_URL=$(git remote get-url origin)
            REMOTE_URL=${REMOTE_URL#https://}
            REMOTE_URL=${REMOTE_URL#git@github.com:}
            REMOTE_URL=${REMOTE_URL%.git}
            git push "https://${GIT_USER}:${GIT_TOKEN}@github.com/${REMOTE_URL}.git" HEAD:${BRANCH_NAME}
          '''
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}
