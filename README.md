# Artrade Backend

Artrade backend services

## Getting started

Frameworks and tools used in the project:

- yarn

## Setup developer environment - local machine

### Node & yarn

The project use node 16.x as it targets aws lambda node runtime (16.x). You can
use [nvm](https://github.com/nvm-sh/nvm#install--update-script) or [volta](https://docs.volta.sh/advanced/installers) as
node version manager.

### Serverless

The project depends on [serverless](https://www.serverless.com/framework/docs) framework the easiest way to have
serverless on your machine is to install it with yarn.

`yarn global add serverless`

The project depends also on serverless-compose so the minimum serverless version required is 3.15.x

Also, you have to run `yarn install` in each serverless projects. This can be done, with the script `scripts/install.sh`
that have to be run from the root artrade-backend.

#### Deploying

In order to deploy the aws resources. You have to set up a profile in serverless projects.

You have to add this config in each serverless projects (inside sesrverless.yml file)

```yaml
custom:
  xxart: # <-- this name will be used as a prefix in the aws account
    profile: dev
    solanaNetwork: 'devnet'
  # other profiles
```

This config sould be added in:

- `cognito/serverless.yml`
- `auth-api/serverless.yml`
- `users/serverless.yml`
- `layers/serverless.yml`

### AWS

You could use aws-cli to interact with AWS Artrade accounts, but this is not used to directly deploy the project (which
is deployed by serverless). aws-cli is required to set up AWS credentials. You could do it with aws-cli tool or manually
by creating credentials file located in home. Here an example of a credentials file set up to have access on AWS dev
account.

`$HOME/.aws/credentials`

```text
[default]
aws_access_key_id = XXX123
aws_secret_access_key = XXX123-xxx

[dev]
aws_access_key_id = XXX123
aws_secret_access_key = XXX123-xxx
aws_session_token = XXX123-xxx
```

The default profile contains the key id and access key received at your AWS Account creation. If you don't have an AWS
account or lost your keys please contact bl@artrade.app

The dev profile contains the creds used by serverless to deploy the project on the dev AWS account. You can obtain this
temporary credentials by launching

`aws sts assume-role --role-arn arn:aws:iam::<AwsAccountId>:role/<RoleToAssume> --role-session-name dev --duration-seconds 28800`

from your terminal. If succeeded, this command return aws_access_key_id, aws_secret_access_key and aws_session_token
that you can copy and paste to your .aws/credentials file.

### Tooling

The project uses prettier to format code. You can launch `yarn format` from your terminal or configure your IDE tu
use prettier config.

The project uses eslint to lint code. You can launch `yarn lint` from your terminal or configure your IDE to use
eslint config.



### Run the project

```
yarn install
yarn start
```
