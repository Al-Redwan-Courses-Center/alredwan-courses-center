import SignupForm from "@/components/auth/SignupForm";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";

export default function SignupModal() {
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary" size="small">
          إنشاء حساب
        </Button>
      </ModalTrigger>

      <ModalContent className="max-h-7/10 max-w-1/2">
        <ModalTitle>إنشاء حساب</ModalTitle>
        <div className="flex max-h-full w-full flex-col items-center overflow-y-auto">
          <SignupForm />
        </div>
      </ModalContent>
    </Modal>
  );
}
